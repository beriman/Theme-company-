import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GitHub OAuth Routes
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
    }
    
    const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const redirectUri = `${appUrl}/auth/github/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "repo,user",
      response_type: "code",
    });

    res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
  });

  app.get(["/auth/github/callback", "/auth/github/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code missing");

    try {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await response.json();
      const accessToken = data.access_token;

      if (!accessToken) {
        return res.status(400).send("Failed to get access token");
      }

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', accessToken: '${accessToken}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // API to fetch repositories
  app.get("/api/github/repos", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    try {
      const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: {
          Authorization: authHeader,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ThemeCompany-AI-Studio"
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const repos = await response.json();
      res.json(repos);
    } catch (error) {
      console.error("Fetch repos error:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  // API to create a new repository
  app.post("/api/github/repos", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const { name, description, private: isPrivate } = req.body;

    try {
      const response = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ThemeCompany-AI-Studio",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          private: isPrivate !== undefined ? isPrivate : true,
          auto_init: true // Initialize with a README
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create repository");
      }

      const repo = await response.json();
      res.json(repo);
    } catch (error: any) {
      console.error("Create repo error:", error);
      res.status(500).json({ error: error.message || "Failed to create repository" });
    }
  });

  // API to push a file to a repository
  app.post("/api/github/file", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const { owner, repo, path: filePath, content, message } = req.body;

    try {
      // 1. Check if file exists to get its SHA (required for updating existing files)
      let sha;
      const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        headers: {
          Authorization: authHeader,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ThemeCompany-AI-Studio"
        }
      });

      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      // 2. Create or update the file
      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ThemeCompany-AI-Studio",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: message || `Update ${filePath} via AI Studio`,
          content: Buffer.from(content).toString('base64'),
          sha
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(errData.message || "Failed to push file");
      }

      const result = await putRes.json();
      res.json(result);
    } catch (error: any) {
      console.error("Push file error:", error);
      res.status(500).json({ error: error.message || "Failed to push file" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
