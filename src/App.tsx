import React, { useState, useEffect, useRef } from 'react';
import { Agent, Project, Role, Department } from './types';
import { generateAgents, ROLES } from './gameLogic';
import { TRAINING_SKILLS, TrainingSkill } from './trainingSkills';
import { Users, Briefcase, Terminal, Plus, Code, Play, CheckSquare, X, Network, Zap, Coins, TrendingUp, Lightbulb, Cpu, Rocket, Package, Download, Save, FolderOpen, UploadCloud, FileCode, GraduationCap, MessageSquare, Monitor } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'test_key' });

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  creativityCost?: number;
  effect: () => void;
  owned: boolean;
}

interface LocalFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  content?: string;
}

type ViewState = 'start' | 'draft' | 'main';

export default function App() {
  const [view, setView] = useState<ViewState | 'repo_select'>('start');
  const [appClosed, setAppClosed] = useState(false);
  const [mainTab, setMainTab] = useState<'tasks' | 'orgchart' | 'upgrades' | 'boardroom' | 'files'>('tasks');
  const [ops, setOps] = useState(100);
  const [opsMax, setOpsMax] = useState(100);
  const [credits, setCredits] = useState(0);
  const [creativity, setCreativity] = useState(0);
  const [shippedProducts, setShippedProducts] = useState(0);
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [opsRate, setOpsRate] = useState(1); // ops per second
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [marketingLevel, setMarketingLevel] = useState(1);
  const [autoTaskerEnabled, setAutoTaskerEnabled] = useState(false);
  
  // Meeting State
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingParticipantIds, setMeetingParticipantIds] = useState<string[]>([]);
  const [meetingMessages, setMeetingMessages] = useState<{ agent: Agent, text: string }[]>([]);
  const [meetingStatus, setMeetingStatus] = useState<'setup' | 'in_progress' | 'summarizing' | 'concluded'>('setup');
  const [meetingOptions, setMeetingOptions] = useState<{ title: string, prompt: string, suggestedAgentName?: string }[]>([]);
  
  const [company, setCompany] = useState<{ name: string; vision: string; mission: string } | null>(() => {
    const saved = localStorage.getItem('company_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [githubUsername, setGithubUsername] = useState<string | null>(localStorage.getItem('github_username'));
  const [activeRepo, setActiveRepo] = useState<any | null>(() => {
    const saved = localStorage.getItem('active_repo');
    return saved ? JSON.parse(saved) : null;
  });
  const [localFiles, setLocalFiles] = useState<LocalFile[]>(() => {
    const saved = localStorage.getItem('ide_files');
    return saved ? JSON.parse(saved) : [
      { path: 'README.md', name: 'README.md', type: 'file', content: '# Local IDE Workspace\n\nCreate files and folders here. Push to GitHub when ready!' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ide_files', JSON.stringify(localFiles));
  }, [localFiles]);

  const [currentPath, setCurrentPath] = useState('');
  const [viewingFileContent, setViewingFileContent] = useState<{ path: string, content: string } | null>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [showRepoList, setShowRepoList] = useState(false);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoForm, setNewRepoForm] = useState({ name: '', description: '' });
  const [pushFilePath, setPushFilePath] = useState('src/App.tsx');
  const [pushingFile, setPushingFile] = useState(false);
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [draftOptions, setDraftOptions] = useState<Agent[]>([]);
  const [draftRole, setDraftRole] = useState<Role>('Frontend');
  const [logs, setLogs] = useState<string[]>([]);
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ title: '', prompt: '', pipeline: [] as string[] });
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [orgModalAgent, setOrgModalAgent] = useState<Agent | null>(null);
  const [agentModalTab, setAgentModalTab] = useState<'profile' | 'training'>('profile');
  const [editingInstructions, setEditingInstructions] = useState<boolean>(false);
  const [editedBundle, setEditedBundle] = useState<Record<string, string>>({});
  const [ownedUpgrades, setOwnedUpgrades] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const meetingActiveRef = useRef<boolean>(false);

  const UPGRADES: Upgrade[] = [
    { 
      id: 'ops_max_1', 
      name: 'Server Rack Expansion', 
      description: 'Increase Max Ops by 100.', 
      cost: 200, 
      owned: ownedUpgrades.includes('ops_max_1'),
      effect: () => setOpsMax(prev => prev + 100) 
    },
    { 
      id: 'ops_rate_1', 
      name: 'Fiber Optic Upgrade', 
      description: 'Increase Ops regeneration by 1/sec.', 
      cost: 500, 
      owned: ownedUpgrades.includes('ops_rate_1'),
      effect: () => setOpsRate(prev => prev + 1) 
    },
    { 
      id: 'auto_tasker', 
      name: 'Auto-Tasker v1.0', 
      description: 'Automatically assigns idle agents to open tasks.', 
      cost: 1500, 
      owned: ownedUpgrades.includes('auto_tasker'),
      effect: () => setAutoTaskerEnabled(true) 
    },
    { 
      id: 'speed_1', 
      name: 'Quantum Processors', 
      description: 'Agents work 2x faster.', 
      cost: 3000, 
      owned: ownedUpgrades.includes('speed_1'),
      effect: () => setSpeedMultiplier(prev => prev * 2) 
    },
    { 
      id: 'creativity_boost', 
      name: 'Creative Algorithms', 
      description: 'Double the rate of Creativity generation.', 
      cost: 5000, 
      owned: ownedUpgrades.includes('creativity_boost'),
      effect: () => {} // Handled in the interval
    },
    { 
      id: 'ops_max_2', 
      name: 'Data Center Lease', 
      description: 'Increase Max Ops by 500.', 
      cost: 10000, 
      owned: ownedUpgrades.includes('ops_max_2'),
      effect: () => setOpsMax(prev => prev + 500) 
    },
    { 
      id: 'creativity_project_1', 
      name: 'Neural Network Optimization', 
      description: 'Permanent 25% boost to Ops regeneration.', 
      cost: 0,
      creativityCost: 50,
      owned: ownedUpgrades.includes('creativity_project_1'),
      effect: () => setOpsRate(prev => prev * 1.25) 
    },
    { 
      id: 'creativity_project_2', 
      name: 'Algorithmic Efficiency', 
      description: 'Tasks cost 50% less Ops.', 
      cost: 0,
      creativityCost: 100,
      owned: ownedUpgrades.includes('creativity_project_2'),
      effect: () => {} // Handled in assignAgent
    },
    { 
      id: 'marketing_1', 
      name: 'Aggressive Marketing', 
      description: 'Increase task rewards by 50%.', 
      cost: 2500,
      owned: ownedUpgrades.includes('marketing_1'),
      effect: () => setMarketingLevel(prev => prev + 0.5) 
    },
  ];

  const buyUpgrade = (upgrade: Upgrade) => {
    const canAffordCredits = credits >= upgrade.cost;
    const canAffordCreativity = !upgrade.creativityCost || creativity >= upgrade.creativityCost;

    if (canAffordCredits && canAffordCreativity && !upgrade.owned) {
      setCredits(prev => prev - upgrade.cost);
      if (upgrade.creativityCost) setCreativity(prev => prev - upgrade.creativityCost!);
      setOwnedUpgrades(prev => [...prev, upgrade.id]);
      upgrade.effect();
      addLog(`Purchased upgrade: ${upgrade.name}`);
    } else if (upgrade.owned) {
      addLog("You already own this upgrade.");
    } else {
      addLog("Not enough resources!");
    }
  };

  const DEPARTMENTS: Department[] = ['Executive', 'Engineering', 'Product', 'QA'];

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg].slice(-50));
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchGithubUser = async (token: string) => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGithubUsername(data.login);
        localStorage.setItem('github_username', data.login);
      }
    } catch (err) {
      console.error("Failed to fetch GitHub user:", err);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const token = event.data.accessToken;
        setGithubToken(token);
        localStorage.setItem('github_token', token);
        addLog("GitHub connected successfully!");
        fetchGithubUser(token);
        if (view === 'start') {
          setView('repo_select');
          // Delay fetch to let state settle
          setTimeout(() => {
             fetchReposWithToken(token);
          }, 500);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [view]);

  const fetchReposWithToken = async (token: string) => {
    setLoadingRepos(true);
    try {
      const response = await fetch('/api/github/repos', {
        headers: { Authorization: `token ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setRepos(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (githubToken && !githubUsername) {
      fetchGithubUser(githubToken);
    }
  }, [githubToken, githubUsername]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => ({
        ...agent,
        lastHeartbeat: Date.now()
      })));
      
      setOps(prev => {
        if (prev >= opsMax) {
          const boost = ownedUpgrades.includes('creativity_boost') ? 2 : 1;
          setCreativity(c => c + (0.1 * boost));
          return opsMax;
        }
        return Math.min(opsMax, prev + opsRate);
      });
      
      setCredits(prev => prev + passiveIncome);
    }, 1000);
    return () => clearInterval(interval);
  }, [opsMax, opsRate, ownedUpgrades, passiveIncome]);

  // Auto-Tasker Logic
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Process pipelines
      const pipelineTask = projects.find(p => p.status === 'open' && p.pipeline && p.pipeline.length > (p.pipelineIndex || 0));
      if (pipelineTask && ops >= 20) {
        const nextAgentId = pipelineTask.pipeline![pipelineTask.pipelineIndex || 0];
        const nextAgent = agents.find(a => a.id === nextAgentId);
        if (nextAgent && nextAgent.status === 'idle') {
          assignAgent(pipelineTask.id, nextAgentId);
          return;
        }
      }

      // 2. Process Auto-Tasker
      if (!autoTaskerEnabled) return;
      const openTask = projects.find(p => p.status === 'open' && (!p.pipeline || p.pipeline.length === 0));
      if (!openTask) return;

      const idleAgent = agents.find(a => a.status === 'idle');
      if (!idleAgent) return;

      if (ops >= 20) {
        assignAgent(openTask.id, idleAgent.id);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoTaskerEnabled, projects, agents, ops, ownedUpgrades]);

  const connectGitHub = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      const data = await response.json();
      
      if (!response.ok || data.error) {
        addLog(`GitHub Setup Required: ${data.error || 'Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in AI Studio settings.'}`);
        return;
      }
      
      window.open(data.url, 'github_oauth', 'width=600,height=700');
      addLog("Opening GitHub authorization popup...");
    } catch (err) {
      addLog("Failed to start GitHub connection. Check console for details.");
      console.error("GitHub connection error:", err);
    }
  };

  const fetchRepos = async () => {
    if (!githubToken) return;
    setLoadingRepos(true);
    try {
      const response = await fetch('/api/github/repos', {
        headers: { Authorization: `token ${githubToken}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setRepos(data);
        setShowRepoList(true);
      } else {
        addLog("Failed to fetch repositories: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      addLog("Failed to fetch GitHub repositories.");
    } finally {
      setLoadingRepos(false);
    }
  };

  const selectRepo = (repo: any) => {
    setActiveRepo(repo);
    localStorage.setItem('active_repo', JSON.stringify(repo));
    setShowRepoList(false);
    addLog(`Memory Card set to: ${repo.name}`);
  };

  const loadFiles = (path = '') => {
    setCurrentPath(path);
  };

  const handleCreateFile = () => {
    const name = prompt('Enter file name (e.g., index.js):');
    if (!name) return;
    const newPath = currentPath ? `${currentPath}/${name}` : name;
    if (localFiles.some(f => f.path === newPath)) {
      addLog('Error: File already exists.');
      return;
    }
    setLocalFiles([...localFiles, { path: newPath, name, type: 'file', content: '' }]);
    addLog(`Created file: ${newPath}`);
  };

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    const newPath = currentPath ? `${currentPath}/${name}` : name;
    if (localFiles.some(f => f.path === newPath)) {
      addLog('Error: Folder already exists.');
      return;
    }
    setLocalFiles([...localFiles, { path: newPath, name, type: 'dir' }]);
    addLog(`Created folder: ${newPath}`);
  };

  const createRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken || !newRepoForm.name) return;
    
    setLoadingRepos(true);
    try {
      const response = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 
          Authorization: `token ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRepoForm)
      });
      const data = await response.json();
      if (response.ok) {
        addLog(`Created new repository: ${data.name}`);
        selectRepo(data);
        setShowCreateRepo(false);
        setNewRepoForm({ name: '', description: '' });
      } else {
        addLog(`Failed to create repo: ${data.error}`);
      }
    } catch (err) {
      addLog("Error creating repository.");
    } finally {
      setLoadingRepos(false);
    }
  };

  const pushToGitHub = async (project: Project, customPath?: string) => {
    if (!githubToken || !activeRepo || !project.resultCode) return;
    
    const targetPath = customPath || pushFilePath;
    setPushingFile(true);
    try {
      const response = await fetch('/api/github/file', {
        method: 'POST',
        headers: { 
          Authorization: `token ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          owner: activeRepo.owner.login,
          repo: activeRepo.name,
          path: targetPath,
          content: project.resultCode,
          message: `AI Studio: Update ${targetPath}`
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        addLog(`Successfully pushed code to ${activeRepo.name}/${targetPath}`);
        if (customPath) {
          setViewingFileContent(null);
        } else {
          setViewingProject(null);
        }
      } else {
        addLog(`Failed to push code: ${data.error}`);
      }
    } catch (err) {
      addLog("Error pushing code to GitHub.");
    } finally {
      setPushingFile(false);
    }
  };

  const startDraft = () => {
    if (!githubToken) {
      connectGitHub();
      return;
    }
    if (!activeRepo) {
      setView('repo_select');
      fetchRepos();
      return;
    }
    if (!company) {
      setShowCompanySetup(true);
      return;
    }
    setDraftRole('Frontend');
    setDraftOptions(generateAgents(3, 'Frontend'));
    setView('draft');
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const info = {
      name: formData.get('name') as string,
      vision: formData.get('vision') as string,
      mission: formData.get('mission') as string,
    };
    setCompany(info);
    localStorage.setItem('company_info', JSON.stringify(info));
    setShowCompanySetup(false);
    addLog(`Company profile established: ${info.name}`);
    if (view === 'start' || view === 'repo_select') {
      setDraftRole('Frontend');
      setDraftOptions(generateAgents(3, 'Frontend'));
      setView('draft');
    }
  };

  const openHire = (role: Role) => {
    setDraftRole(role);
    setDraftOptions(generateAgents(3, role));
    setView('draft');
  };

  const fireAgent = (id: string) => {
    const agent = agents.find(a => a.id === id);
    setAgents(prev => prev.filter(a => a.id !== id));
    setOrgModalAgent(null);
    if (agent) addLog(`Fired ${agent.role} Agent: ${agent.name}`);
  };

  const moveAgent = (id: string, newDept: Department, makeLead: boolean) => {
    setAgents(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, department: newDept, isLead: makeLead };
      }
      if (makeLead && a.department === newDept && a.isLead) {
        return { ...a, isLead: false };
      }
      return a;
    }));
    setOrgModalAgent(null);
  };

  const hireAgent = (agent: Agent) => {
    setAgents(prev => [...prev, agent]);
    addLog(`Hired ${agent.role} Agent: ${agent.name} (${agent.personality.name})`);
    setView('main');
  };

  const trainAgent = (agent: Agent, skill: TrainingSkill) => {
    if (credits < skill.costCredits || creativity < skill.costCreativity) {
      addLog(`Not enough resources to train ${agent.name} in ${skill.name}.`);
      return;
    }

    setCredits(prev => prev - skill.costCredits);
    setCreativity(prev => prev - skill.costCreativity);

    const updatedAgent = {
      ...agent,
      learnedSkills: [...(agent.learnedSkills || []), skill.id],
      skills: {
        ...agent.skills,
        [agent.role]: Math.min(100, (agent.skills[agent.role] || 0) + skill.impact)
      },
      instructionsBundle: {
        ...agent.instructionsBundle,
        files: {
          ...agent.instructionsBundle.files,
          [`training_${skill.id}.md`]: `The agent has completed autoresearch on: ${skill.name}.\nThey should apply this knowledge: ${skill.description}.`
        }
      }
    };

    setAgents(prev => prev.map(a => a.id === agent.id ? updatedAgent : a));
    if (orgModalAgent?.id === agent.id) {
      setOrgModalAgent(updatedAgent);
    }
    
    addLog(`Trained ${agent.name} in ${skill.name}! Skill level increased by ${skill.impact}.`);
  };

  const startMeeting = async () => {
    if (!meetingTopic || meetingParticipantIds.length === 0) return;
    setMeetingStatus('in_progress');
    setMeetingMessages([]);
    meetingActiveRef.current = true;
    
    const participants = agents.filter(a => meetingParticipantIds.includes(a.id));
    let currentHistory = `Topic: ${meetingTopic}\n\n`;
    let newMessages: { agent: Agent, text: string }[] = [];

    for (const agent of participants) {
      if (!meetingActiveRef.current) break;
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'thinking' } : a));
      
      try {
        const prompt = `You are ${agent.name}, a ${agent.role} in a software company. Your personality: ${agent.personality.description}.
        
The team is in a board meeting discussing the following issue/topic: "${meetingTopic}"

Here is the discussion so far:
${currentHistory}

Provide your professional opinion on the issue. You can agree or disagree with previous points, and you should propose a concrete technical or product direction. Keep your response concise, around 2-3 sentences. Speak in character.`;

        const response = await ai.models.generateContent({
          model: agent.llmModel,
          contents: prompt,
          config: {
            systemInstruction: `You are participating in a multi-agent board meeting. Stay in character as ${agent.name} (${agent.role}).`
          }
        });

        if (!meetingActiveRef.current) {
          setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'idle' } : a));
          break;
        }

        const text = response.text || '*remains silent*';
        currentHistory += `${agent.name} (${agent.role}): ${text}\n\n`;
        
        newMessages.push({ agent, text });
        setMeetingMessages([...newMessages]);
        
      } catch (err) {
        if (!meetingActiveRef.current) {
          setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'idle' } : a));
          break;
        }
        console.error(err);
        const text = '*Experienced a connection error and left the meeting.*';
        currentHistory += `${agent.name} (${agent.role}): ${text}\n\n`;
        newMessages.push({ agent, text });
        setMeetingMessages([...newMessages]);
      }
      
      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'idle' } : a));
    }
  };

  const cancelMeeting = () => {
    meetingActiveRef.current = false;
    setMeetingStatus('setup');
    setMeetingTopic('');
    setMeetingParticipantIds([]);
    setMeetingMessages([]);
    setAgents(prev => prev.map(a => meetingParticipantIds.includes(a.id) ? { ...a, status: 'idle' } : a));
    addLog('Meeting cancelled.');
  };

  const concludeMeeting = async () => {
    setMeetingStatus('summarizing');
    
    try {
      const transcript = meetingMessages.map(m => `${m.agent.name} (${m.agent.role}): ${m.text}`).join('\n\n');
      
      const prompt = `Based on the following meeting transcript about "${meetingTopic}", summarize the outcomes into 1 to 3 distinct, actionable task options.
      
Transcript:
${transcript}

For each option, provide:
1. A concise title for the task.
2. A detailed prompt/requirements description for the task.
3. The name of the agent best suited to execute this task (must be one of the participants).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    suggestedAgentName: { type: Type.STRING }
                  },
                  required: ["title", "prompt"]
                }
              }
            },
            required: ["options"]
          }
        }
      });

      const data = JSON.parse(response.text || '{"options":[]}');
      setMeetingOptions(data.options || []);
      setMeetingStatus('concluded');
    } catch (err) {
      console.error(err);
      addLog("Failed to summarize meeting.");
      setMeetingStatus('in_progress');
    }
  };

  const createMeetingTask = (option: { title: string, prompt: string, suggestedAgentName?: string }) => {
    const suggestedAgent = agents.find(a => a.name === option.suggestedAgentName);
    
    const newProj: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: option.title,
      prompt: option.prompt,
      status: 'open',
      assignedAgentId: suggestedAgent ? suggestedAgent.id : undefined
    };
    setProjects(prev => [newProj, ...prev]);
    addLog(`Created task from meeting: ${newProj.title}`);
    
    // Remove the option so it's not clicked twice
    setMeetingOptions(prev => prev.filter(o => o.title !== option.title));
  };

  const saveInstructions = () => {
    if (!orgModalAgent) return;
    setAgents(prev => prev.map(a => {
      if (a.id === orgModalAgent.id) {
        return {
          ...a,
          instructionsBundle: {
            ...a.instructionsBundle,
            files: editedBundle
          }
        };
      }
      return a;
    }));
    setOrgModalAgent(prev => prev ? {
      ...prev,
      instructionsBundle: {
        ...prev.instructionsBundle,
        files: editedBundle
      }
    } : null);
    setEditingInstructions(false);
    addLog(`Updated instructions bundle for ${orgModalAgent.name}`);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewProjectForm({ ...newProjectForm, prompt: val });
    
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/(?:^|\s)@([^\s]*)$/);
    
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.title || !newProjectForm.prompt) return;
    
    const newProj: Project = {
      id: Math.random().toString(36).substr(2, 9),
      title: newProjectForm.title,
      prompt: newProjectForm.prompt,
      status: 'open',
      pipeline: newProjectForm.pipeline,
      pipelineIndex: 0
    };
    setProjects([newProj, ...projects]);
    setShowNewProject(false);
    setNewProjectForm({ title: '', prompt: '', pipeline: [] });
    addLog(`Created new task: ${newProj.title}`);
  };

  const shipProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setShippedProducts(prev => prev + 1);
    
    const incomeBoost = Math.floor(5 * marketingLevel);
    setPassiveIncome(prev => prev + incomeBoost);
    
    addLog(`Shipped [${project.title}] to market! Passive income +${incomeBoost}/sec.`);
  };

  const downloadCode = (project: Project) => {
    if (!project.resultCode) return;
    const blob = new Blob([project.resultCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog(`Downloaded ${project.title} code.`);
  };

  const assignAgent = async (projectId: string, agentId: string) => {
    const project = projects.find(p => p.id === projectId);
    const agent = agents.find(a => a.id === agentId);
    if (!project || !agent) return;

    const cost = ownedUpgrades.includes('creativity_project_2') ? 10 : 20;
    if (ops < cost) {
      addLog(`Not enough Ops! Need ${cost} Ops to start a task.`);
      return;
    }

    setOps(prev => prev - cost);
    const lead = agents.find(a => a.department === agent.department && a.isLead);

    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'working' } : a));
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'working', assignedAgentId: agentId } : p));
    addLog(`Assigned ${agent.name} to [${project.title}]. (Consumed ${cost} Ops)`);

    // Calculate delay based on personality
    const baseDelay = 2000 / speedMultiplier;
    const agentTime = agent.personality.timeMultiplier;
    const leadTime = lead ? lead.personality.timeMultiplier : 1.0;
    const totalDelay = baseDelay * agentTime * leadTime;

    if (lead && lead.id !== agent.id) {
      addLog(`Lead ${lead.name} (${lead.personality.name}) is influencing the work...`);
    }

    // Simulate work time
    await new Promise(resolve => setTimeout(resolve, totalDelay));

    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'thinking' } : a));

    try {
      let finalSystemInstruction = `[${agent.instructionsBundle.entryFile}]\n${agent.instructionsBundle.files[agent.instructionsBundle.entryFile]}\n\n`;
      finalSystemInstruction += `[personality.md]\n${agent.instructionsBundle.files['personality.md']}\n\n`;
      finalSystemInstruction += `[company_context.md]\n${company ? `Company: ${company.name}\nVision: ${company.vision}\nMission: ${company.mission}` : agent.instructionsBundle.files['company_context.md']}`;
      
      if (lead && lead.id !== agent.id) {
        finalSystemInstruction += `\n\n[lead_influence.md]\nYour department lead demands: ${lead.personality.promptInjection}`;
      }

      const config: any = {
        systemInstruction: finalSystemInstruction,
      };

      // Add thinking mode for Pro models
      if (agent.llmModel === 'gemini-3.1-pro-preview') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      let promptContext = `Task: ${project.prompt}\n\n`;
      
      // Extract all @mentions
      const mentionRegex = /(?:^|\s)@([^\s]+)/g;
      const mentions = [...project.prompt.matchAll(mentionRegex)].map(m => m[1]);
      
      if (mentions.length > 0) {
        promptContext += `Here are the reference files you requested:\n\n`;
        mentions.forEach(mentionPath => {
          const file = localFiles.find(f => f.path === mentionPath && f.type === 'file');
          if (file) {
            promptContext += `--- BEGIN ${file.path} ---\n${file.content}\n--- END ${file.path} ---\n\n`;
          } else {
            promptContext += `--- BEGIN ${mentionPath} ---\n(File not found or is a directory)\n--- END ${mentionPath} ---\n\n`;
          }
        });
      }
      
      promptContext += `Please write the code for this task. Return the result ONLY as a JSON object with a 'files' array, where each item has a 'path' (string) and 'content' (string). Do not include markdown blocks or any other text.`;

      const response = await ai.models.generateContent({
        model: agent.llmModel,
        contents: promptContext,
        config: {
          ...config,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              files: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    path: { type: Type.STRING, description: "File path, e.g., src/components/Button.tsx" },
                    content: { type: Type.STRING, description: "The actual code content" }
                  },
                  required: ["path", "content"]
                }
              }
            },
            required: ["files"]
          }
        }
      });

      let code = '';
      try {
        let textToParse = response.text || '{}';
        
        // Extract JSON from markdown block if present
        const match = textToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
          textToParse = match[1];
        }
        
        const parsed = JSON.parse(textToParse.trim());
        if (parsed.files && Array.isArray(parsed.files)) {
          code = parsed.files.map((f: any) => `// ${f.path}\n${f.content}`).join('\n\n');
          
          setLocalFiles(prev => {
            let newFiles = [...prev];
            parsed.files.forEach((gf: any) => {
              let cleanPath = gf.path.replace(/^\/+/, ''); // Remove leading slashes
              const existingIndex = newFiles.findIndex(f => f.path === cleanPath);
              if (existingIndex >= 0) {
                newFiles[existingIndex] = { ...newFiles[existingIndex], content: gf.content };
              } else {
                const parts = cleanPath.split('/');
                let currentPath = '';
                for (let i = 0; i < parts.length - 1; i++) {
                  currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
                  if (!newFiles.some(f => f.path === currentPath)) {
                    newFiles.push({ path: currentPath, name: parts[i], type: 'dir' });
                  }
                }
                newFiles.push({ path: cleanPath, name: parts[parts.length - 1], type: 'file', content: gf.content });
              }
            });
            return newFiles;
          });
          addLog(`Agent ${agent.name} created/updated ${parsed.files.length} files in the workspace.`);
        } else {
          code = response.text || '// No code generated';
        }
      } catch (e) {
        console.error("Failed to parse agent output", e);
        addLog(`Agent ${agent.name} failed to format output correctly. Code saved to task result.`);
        code = response.text || '// No code generated';
      }

      const reward = Math.floor(50 * marketingLevel);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'completed', resultCode: code } : p));
      addLog(`Task [${project.title}] completed by ${agent.name}! (+${reward} Credits)`);
      setCredits(prev => prev + reward);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'idle' } : a));
    } catch (error) {
      addLog(`Error on [${project.title}]: ${error}`);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'open', assignedAgentId: undefined } : p));
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'idle' } : a));
    }
  };

  if (appClosed) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-start justify-start bg-[#008080]">
        <div 
          className="flex flex-col items-center gap-2 cursor-pointer p-4 hover:bg-white/20 rounded w-32"
          onClick={() => setAppClosed(false)}
        >
          <div className="w-16 h-16 bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black flex items-center justify-center text-[#000080]">
            <Monitor size={32} />
          </div>
          <span className="text-white font-bold text-center text-sm">ThemeCompany_DevStudio.exe</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-8 flex items-center justify-center bg-[#008080]">
      <div className="window w-full max-w-6xl min-h-[95vh] lg:h-[90vh] flex flex-col relative">
        <div className="window-header">
          <span>ThemeCompany_DevStudio.exe</span>
          <div className="flex gap-1">
            <div className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs cursor-pointer">_</div>
            <div className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs cursor-pointer">□</div>
            <div className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs cursor-pointer" onClick={() => setAppClosed(true)}>X</div>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
          {view === 'start' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 lg:gap-8 p-4">
              <h1 className="text-4xl lg:text-8xl text-center text-[#000080] drop-shadow-md tracking-widest">THEME COMPANY</h1>
              <h2 className="text-xl lg:text-3xl text-center text-red-700 font-bold">AI DEV STUDIO</h2>
              <p className="text-lg lg:text-2xl text-center max-w-2xl bg-[#fff] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Hire AI agents with unique personas to generate real code for your projects.
              </p>
              <button className="btn-retro text-2xl lg:text-4xl px-8 lg:px-12 py-4 lg:py-6 mt-4 lg:mt-8" onClick={startDraft}>
                {!githubToken ? '1. CONNECT GITHUB' : !activeRepo ? '2. SELECT REPOSITORY' : !company ? '3. SETUP COMPANY' : 'INITIALIZE STUDIO'}
              </button>
            </div>
          )}

          {view === 'repo_select' && (
            <div className="flex-1 flex flex-col gap-4 p-4 lg:p-8 max-w-4xl mx-auto w-full h-full overflow-hidden">
              <div className="bg-[#000080] text-white p-2 lg:p-3 text-xl lg:text-3xl text-center border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                INITIALIZING WORKSPACE...
              </div>

              <div className="flex flex-col gap-4 p-4 bg-[#c0c0c0] panel-inset flex-1 overflow-y-auto">
                <h3 className="text-2xl lg:text-4xl font-bold text-center mb-2">Select Project Target</h3>
                <p className="text-lg lg:text-xl text-center mb-6">Will this be a new venture (Greenfield) or reviving an existing one (Brownfield)?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                  {/* Greenfield */}
                  <div className="panel-inset bg-white p-4 flex flex-col">
                    <h4 className="text-2xl font-bold text-green-700 border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
                      <FolderOpen /> Greenfield
                    </h4>
                    <p className="text-gray-700 mb-4 text-lg flex-1">Create a brand new GitHub repository for your AI agents to build from scratch.</p>

                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!githubToken || !newRepoForm.name) return;
                        setLoadingRepos(true);
                        try {
                          const res = await fetch('/api/github/repos', {
                            method: 'POST',
                            headers: {
                              Authorization: `token ${githubToken}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(newRepoForm)
                          });
                          const data = await res.json();
                          if (res.ok && data.id) {
                            addLog(`Created new repository: ${data.name}`);
                            setActiveRepo(data);
                            localStorage.setItem('active_repo', JSON.stringify(data));
                            if (!company) {
                                setShowCompanySetup(true);
                                setView('start');
                            } else {
                                setDraftRole('Frontend');
                                setDraftOptions(generateAgents(3, 'Frontend'));
                                setView('draft');
                            }
                          } else {
                            addLog(`Failed to create repo: ${data.error || data.message}`);
                          }
                        } catch (err) {
                          addLog("Error creating repository.");
                        } finally {
                          setLoadingRepos(false);
                        }
                    }} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-lg font-bold mb-1">Repository Name:</label>
                        <input
                          required
                          className="w-full border-2 border-gray-400 p-2 bg-gray-100 focus:bg-white text-lg"
                          value={newRepoForm.name}
                          onChange={e => setNewRepoForm({...newRepoForm, name: e.target.value})}
                          placeholder="e.g., ai-startup-app"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-bold mb-1">Description:</label>
                        <input
                          className="w-full border-2 border-gray-400 p-2 bg-gray-100 focus:bg-white text-lg"
                          value={newRepoForm.description}
                          onChange={e => setNewRepoForm({...newRepoForm, description: e.target.value})}
                          placeholder="My next big thing..."
                        />
                      </div>
                      <button type="submit" className="btn-retro text-xl py-3 mt-2 font-bold text-[#000080]" disabled={loadingRepos}>
                        {loadingRepos ? 'CREATING...' : 'CREATE & START'}
                      </button>
                    </form>
                  </div>

                  {/* Brownfield */}
                  <div className="panel-inset bg-white p-4 flex flex-col h-full">
                    <h4 className="text-2xl font-bold text-[#000080] border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
                      <Briefcase /> Brownfield
                    </h4>
                    <p className="text-gray-700 mb-4 text-lg">Select an existing repository for your AI agents to maintain and upgrade.</p>

                    <div className="flex-1 border-2 border-gray-400 bg-gray-100 overflow-y-auto p-2 flex flex-col gap-2 min-h-[200px]">
                      {loadingRepos ? (
                        <div className="text-center p-4 text-gray-600 font-bold animate-pulse">Loading Repositories...</div>
                      ) : repos.length === 0 ? (
                        <div className="text-center p-4 text-gray-600 italic">No repositories found.</div>
                      ) : (
                        repos.map(repo => (
                          <div
                            key={repo.id}
                            className={`p-2 border cursor-pointer hover:bg-blue-100 transition-colors ${activeRepo?.id === repo.id ? 'border-blue-500 bg-blue-100 font-bold' : 'border-gray-300 bg-white'}`}
                            onClick={() => {
                              setActiveRepo(repo);
                              localStorage.setItem('active_repo', JSON.stringify(repo));
                            }}
                          >
                            <div className="text-lg truncate">{repo.name}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <button
                      className="btn-retro text-xl py-3 mt-4 font-bold text-[#000080]"
                      disabled={!activeRepo || loadingRepos}
                      onClick={() => {
                        addLog(`Memory Card set to: ${activeRepo.name}`);
                        if (!company) {
                            setShowCompanySetup(true);
                            setView('start');
                        } else {
                            setDraftRole('Frontend');
                            setDraftOptions(generateAgents(3, 'Frontend'));
                            setView('draft');
                        }
                      }}
                    >
                      SELECT & START
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'draft' && (
            <div className="flex-1 flex flex-col gap-3 lg:gap-4 h-full overflow-y-auto">
              <div className="bg-[#000080] text-white p-1 lg:p-2 text-lg lg:text-2xl text-center border-2 border-white flex justify-between items-center shrink-0">
                <span>RECRUIT AI AGENT</span>
                <button className="btn-retro text-black text-xs lg:text-lg py-0 px-2" onClick={() => setView('main')}>CANCEL</button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-4 bg-[#c0c0c0] p-2 lg:p-3 panel-inset">
                <label className="text-sm lg:text-xl font-bold">Position to Fill:</label>
                <select 
                  className="panel-inset flex-1 text-sm lg:text-xl p-1"
                  value={draftRole}
                  onChange={(e) => {
                    const role = e.target.value as Role;
                    setDraftRole(role);
                    setDraftOptions(generateAgents(3, role));
                  }}
                >
                  {ROLES.map(r => <option key={r.role} value={r.role}>{r.role}</option>)}
                </select>
                <button className="btn-retro font-bold text-[#000080] text-sm lg:text-xl" onClick={() => setDraftOptions(generateAgents(3, draftRole))}>
                  REROLL CANDIDATES
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 overflow-y-auto p-1">
                {draftOptions.map(agent => {
                  const topSkills = Object.entries(agent.skills)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 4);

                  return (
                    <div key={agent.id} className="window p-4 flex flex-col items-center gap-4 hover:bg-[#d0d0d0] transition-colors">
                      <img src={agent.avatar} alt={agent.name} className="w-40 h-40 panel-inset bg-white pixelated" style={{ imageRendering: 'pixelated' }} />
                      <div className="text-center w-full bg-white border border-black p-2">
                        <h3 className="text-3xl font-bold">{agent.name}</h3>
                        <p className="text-xl text-[#000080] font-bold">{agent.role}</p>
                        <p className="text-lg text-gray-700" title={agent.personality.description}>Persona: {agent.personality.name}</p>
                      </div>
                      
                      <div className="w-full panel-inset bg-white text-black p-2 lg:p-3 text-sm lg:text-lg flex-1 flex flex-col gap-1 lg:gap-2">
                        <div className="text-[#000080] font-bold mb-1 border-b border-black pb-1 text-xs lg:text-lg">Top Skills:</div>
                        {topSkills.map(([skill, val]) => (
                          <div key={skill} className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] lg:text-sm font-bold">
                              <span className="truncate pr-2">{skill}</span>
                              <span>{val}</span>
                            </div>
                            <div className="w-full bg-gray-200 h-1 lg:h-2 border border-black p-[1px]">
                              <div className="bg-[#000080] h-full" style={{ width: `${val}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button className="btn-retro w-full text-lg lg:text-2xl py-2 lg:py-3" onClick={() => hireAgent(agent)}>HIRE AGENT</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'main' && (
            <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden">
              {/* Top Bar */}
              <div className="flex flex-col lg:flex-row flex-wrap justify-between items-stretch lg:items-center panel-inset bg-[#c0c0c0] p-2 lg:p-3 gap-3 shrink-0">
                <div className="flex gap-2 text-lg lg:text-2xl overflow-x-auto no-scrollbar max-w-full">
                  <button 
                    className={`btn-retro flex items-center gap-2 px-3 lg:px-4 whitespace-nowrap ${mainTab === 'tasks' ? 'bg-gray-400 inset-shadow' : ''}`}
                    onClick={() => setMainTab('tasks')}
                  >
                    <Briefcase size={18} /> <span className="hidden sm:inline">Task Board</span><span className="sm:hidden">Tasks</span>
                  </button>
                  <button 
                    className={`btn-retro flex items-center gap-2 px-3 lg:px-4 whitespace-nowrap ${mainTab === 'orgchart' ? 'bg-gray-400 inset-shadow' : ''}`}
                    onClick={() => setMainTab('orgchart')}
                  >
                    <Network size={18} /> <span className="hidden sm:inline">Org Chart</span><span className="sm:hidden">Org</span>
                  </button>
                  <button 
                    className={`btn-retro flex items-center gap-2 px-3 lg:px-4 whitespace-nowrap ${mainTab === 'upgrades' ? 'bg-gray-400 inset-shadow' : ''}`}
                    onClick={() => setMainTab('upgrades')}
                  >
                    <TrendingUp size={18} /> <span className="hidden sm:inline">Upgrades</span><span className="sm:hidden">Upgr</span>
                  </button>
                  <button 
                    className={`btn-retro flex items-center gap-2 px-3 lg:px-4 whitespace-nowrap ${mainTab === 'boardroom' ? 'bg-gray-400 inset-shadow' : ''}`}
                    onClick={() => setMainTab('boardroom')}
                  >
                    <MessageSquare size={18} /> <span className="hidden sm:inline">Board Room</span><span className="sm:hidden">Meet</span>
                  </button>
                  <button 
                    className={`btn-retro flex items-center gap-2 px-3 lg:px-4 whitespace-nowrap ${mainTab === 'files' ? 'bg-gray-400 inset-shadow' : ''}`}
                    onClick={() => setMainTab('files')}
                  >
                    <FolderOpen size={18} /> <span className="hidden sm:inline">Files</span><span className="sm:hidden">Files</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center justify-between lg:justify-end">
                  <div className="flex items-center gap-4 bg-white px-2 py-1 border border-black text-sm lg:text-xl font-mono">
                    <div className="flex items-center gap-1 text-[#000080]" title="Computing Power (Ops)">
                      <Zap size={16} className="fill-yellow-400 text-yellow-600" />
                      <span>{Math.floor(ops)}/{opsMax}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-700" title="Company Credits">
                      <Coins size={16} className="fill-yellow-400 text-yellow-600" />
                      <span>{credits}</span>
                      {passiveIncome > 0 && <span className="text-xs text-green-500 ml-1">(+{passiveIncome}/s)</span>}
                    </div>
                    <div className="flex items-center gap-1 text-purple-700" title="Creativity (Generated at Max Ops)">
                      <Lightbulb size={16} className="fill-purple-200 text-purple-600" />
                      <span>{Math.floor(creativity)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-700" title="Shipped Products">
                      <Package size={16} className="fill-blue-200 text-blue-600" />
                      <span>{shippedProducts}</span>
                    </div>
                    {autoTaskerEnabled && (
                      <div className="flex items-center gap-1 text-red-600 animate-pulse" title="Auto-Tasker Active">
                        <Cpu size={16} />
                        <span className="text-[10px] hidden sm:inline">AUTO</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 lg:gap-2 flex-wrap justify-end">
                    <button id="new-task-btn" className="btn-retro flex items-center justify-center gap-1 lg:gap-2 text-[10px] lg:text-lg py-1 px-2" onClick={() => setShowNewProject(true)}>
                      <Plus size={14} /> Task
                    </button>
                    <button className="btn-retro flex items-center justify-center gap-1 lg:gap-2 text-[10px] lg:text-lg py-1 px-2" onClick={githubToken ? fetchRepos : connectGitHub}>
                      <Network size={14} /> {githubToken ? (githubUsername || 'GitHub') : 'Connect GitHub'}
                    </button>
                    {githubToken && (
                      <button className="btn-retro flex items-center justify-center gap-1 lg:gap-2 text-[10px] lg:text-lg py-1 px-2" onClick={() => setShowRepoList(true)}>
                        <FolderOpen size={14} /> {activeRepo ? activeRepo.name : 'Link Repo'}
                      </button>
                    )}
                    <button className="btn-retro flex items-center justify-center gap-1 lg:gap-2 text-[10px] lg:text-lg py-1 px-2" onClick={() => setShowCompanySetup(true)}>
                      <Briefcase size={14} /> Co.
                    </button>
                    <button className="btn-retro flex items-center justify-center gap-1 lg:gap-2 text-[10px] lg:text-lg py-1 px-2" onClick={startDraft}>
                      <Users size={14} /> Hire
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {mainTab === 'tasks' ? (
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                    {/* Agents List */}
                    <div className="window flex flex-col min-h-[200px] lg:min-h-0">
                      <div className="bg-[#000080] text-white p-2 text-sm lg:text-xl">STAFF ROSTER</div>
                      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 panel-inset m-2 bg-white">
                        {agents.length === 0 && <div className="text-center text-gray-500 mt-4">No agents hired.</div>}
                        {agents.map(agent => (
                          <div 
                            key={agent.id} 
                            className="flex gap-2 lg:gap-3 items-center border-b-2 border-dashed border-gray-400 pb-2 cursor-pointer hover:bg-gray-200 p-1"
                            onClick={() => {
                              setOrgModalAgent(agent);
                              setEditedBundle(agent.instructionsBundle.files);
                              setEditingInstructions(false);
                            }}
                          >
                            <img src={agent.avatar} alt={agent.name} className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-200 border-2 border-gray-500" style={{ imageRendering: 'pixelated' }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-sm lg:text-xl truncate">{agent.name}</div>
                                <div 
                                  className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full shrink-0 ${
                                    agent.status === 'working' ? 'bg-yellow-400 animate-pulse' : 
                                    agent.status === 'thinking' ? 'bg-blue-400 animate-spin' : 
                                    'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]'
                                  }`}
                                  title={`Status: ${agent.status}`}
                                ></div>
                              </div>
                              <div className="text-xs lg:text-md text-[#000080] font-bold truncate flex items-center gap-1">
                                {agent.role} 
                                <span className="text-[8px] lg:text-[10px] opacity-60 font-normal italic">({agent.status})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-[10px] lg:text-xs text-gray-600 truncate" title={agent.personality.description}>{agent.personality.name}</div>
                                <div className="flex-1 h-1 bg-gray-200 border border-gray-400">
                                  <div className="bg-[#000080] h-full" style={{ width: `${agent.skills[agent.role]}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Projects List */}
                    <div className="window lg:col-span-2 flex flex-col min-h-[300px] lg:min-h-0">
                      <div className="bg-[#000080] text-white p-2 text-sm lg:text-xl">TASK BOARD</div>
                      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-4 panel-inset m-2 bg-[#e0e0e0]">
                        {projects.length === 0 && <div className="text-center text-gray-600 mt-10 text-lg lg:text-xl">No active tasks. Create a new task to generate code.</div>}
                        
                        {projects.map(project => (
                          <div key={project.id} className="border-2 border-black p-2 lg:p-3 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                            <div className="flex justify-between items-start mb-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-lg lg:text-2xl flex items-center gap-2 truncate"><Terminal size={18} /> {project.title}</h4>
                                <p className="text-gray-600 text-sm lg:text-lg line-clamp-2">{project.prompt}</p>
                              </div>
                              <div className={`px-2 py-1 border border-black font-bold text-xs lg:text-lg ml-2 ${
                                project.status === 'completed' ? 'bg-green-300' : 
                                project.status === 'working' ? 'bg-yellow-300 animate-pulse' : 'bg-gray-200'
                              }`}>
                                {project.status.toUpperCase()}
                              </div>
                            </div>
                            
                            <div className="mt-2 lg:mt-4 pt-2 lg:pt-3 border-t-2 border-dashed border-gray-400 flex flex-col sm:flex-row justify-between items-center gap-2">
                              {project.status === 'open' && (
                                <div className="flex items-center gap-2 w-full">
                                  <select 
                                    className="panel-inset flex-1 text-sm lg:text-lg p-1 min-w-0"
                                    id={`assign-${project.id}`}
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Select agent...</option>
                                    {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                                  </select>
                                  <button 
                                    className="btn-retro flex items-center gap-1 text-sm lg:text-lg py-1 px-2"
                                    onClick={() => {
                                      const select = document.getElementById(`assign-${project.id}`) as HTMLSelectElement;
                                      if (select.value) assignAgent(project.id, select.value);
                                    }}
                                  >
                                    <Play size={14} /> START
                                  </button>
                                </div>
                              )}
                              
                              {project.status === 'working' && (
                                <div className="w-full text-center text-sm lg:text-xl text-[#000080] font-bold flex items-center justify-center gap-2">
                                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-[#000080] animate-spin"></div>
                                  CODING...
                                </div>
                              )}

                              {project.status === 'completed' && (
                                <div className="w-full flex justify-between items-center">
                                  <span className="text-sm lg:text-lg text-[#000080] font-bold flex items-center gap-1"><CheckSquare size={16}/> Done</span>
                                  <div className="flex gap-2">
                                    <button className="btn-retro flex items-center gap-1 text-sm lg:text-lg py-1 px-2" onClick={() => setViewingProject(project)}>
                                      <Code size={14} /> VIEW
                                    </button>
                                    {activeRepo && (
                                      <button className="btn-retro flex items-center gap-1 text-sm lg:text-lg py-1 px-2 font-bold text-purple-700" onClick={() => {
                                        setViewingProject(project);
                                        setPushFilePath(`src/${project.title.replace(/\s+/g, '_')}.tsx`);
                                      }}>
                                        <UploadCloud size={14} /> PUSH
                                      </button>
                                    )}
                                    <button className="btn-retro flex items-center gap-1 text-sm lg:text-lg py-1 px-2 font-bold text-green-700" onClick={() => shipProject(project.id)}>
                                      <Rocket size={14} /> SHIP IT
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : mainTab === 'orgchart' ? (
                  <div className="flex-1 overflow-y-auto p-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DEPARTMENTS.map(dept => {
                      const deptAgents = agents.filter(a => a.department === dept);
                      const lead = deptAgents.find(a => a.isLead);
                      const members = deptAgents.filter(a => !a.isLead);
                      
                      const suggestedRole = dept === 'Executive' ? 'CEO' : dept === 'Engineering' ? 'Frontend' : dept === 'Product' ? 'UI/UX' : 'QA';

                      return (
                        <div key={dept} className="window flex flex-col h-full min-h-[300px]">
                          <div className="window-header flex justify-between items-center">
                            <span>{dept} Department</span>
                            {lead && <span className="text-yellow-300 text-sm animate-pulse">Buff Active!</span>}
                          </div>
                          <div className="p-4 bg-[#c0c0c0] flex-1 flex flex-col gap-4">
                            {/* Lead Section */}
                            <div className="panel-inset bg-white p-2">
                              <h4 className="text-[#000080] font-bold text-lg mb-2 border-b-2 border-black">Department Lead</h4>
                              {lead ? (
                                <div 
                                  onClick={() => {
                                    setOrgModalAgent(lead);
                                    setEditedBundle(lead.instructionsBundle.files);
                                    setEditingInstructions(false);
                                  }} 
                                  className="cursor-pointer hover:bg-gray-200 p-2 border border-transparent hover:border-black flex items-center gap-3"
                                >
                                  <img src={lead.avatar} alt={lead.name} className="w-12 h-12 bg-gray-200 border border-black" style={{ imageRendering: 'pixelated' }} />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <div className="font-bold text-xl">{lead.name}</div>
                                      <div className={`w-2 h-2 rounded-full ${lead.status === 'working' ? 'bg-yellow-400 animate-pulse' : lead.status === 'thinking' ? 'bg-blue-400 animate-spin' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]'}`}></div>
                                    </div>
                                    <div className="text-sm text-gray-600">{lead.role} <span className="italic opacity-60 text-[10px]">({lead.status})</span></div>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => openHire(suggestedRole)} className="btn-retro w-full text-gray-600 border-dashed py-2 text-lg">
                                  + Hire Lead
                                </button>
                              )}
                            </div>

                            {/* Members Section */}
                            <div className="panel-inset bg-white p-2 flex-1">
                              <h4 className="text-[#000080] font-bold text-lg mb-2 border-b-2 border-black">Team Members</h4>
                              <div className="flex flex-col gap-2">
                                {members.map(m => (
                                  <div 
                                    key={m.id} 
                                    onClick={() => {
                                      setOrgModalAgent(m);
                                      setEditedBundle(m.instructionsBundle.files);
                                      setEditingInstructions(false);
                                    }} 
                                    className="cursor-pointer hover:bg-gray-200 p-2 border border-transparent hover:border-black flex items-center gap-3"
                                  >
                                    <img src={m.avatar} alt={m.name} className="w-10 h-10 bg-gray-200 border border-black" style={{ imageRendering: 'pixelated' }} />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <div className="font-bold text-lg">{m.name}</div>
                                        <div className={`w-2 h-2 rounded-full ${m.status === 'working' ? 'bg-yellow-400 animate-pulse' : m.status === 'thinking' ? 'bg-blue-400 animate-spin' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]'}`}></div>
                                      </div>
                                      <div className="text-xs text-gray-600">{m.role} <span className="italic opacity-60 text-[8px]">({m.status})</span></div>
                                    </div>
                                  </div>
                                ))}
                                <button onClick={() => openHire(suggestedRole)} className="btn-retro w-full text-gray-600 border-dashed py-2 text-lg">
                                  + Hire Member
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : mainTab === 'upgrades' ? (
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    <div className="window">
                      <div className="bg-[#000080] text-white p-2 text-xl">UPGRADE SHOP</div>
                      <div className="p-4 bg-[#c0c0c0] grid grid-cols-1 md:grid-cols-2 gap-4">
                        {UPGRADES.map(upgrade => (
                          <div key={upgrade.id} className={`panel-inset p-4 flex flex-col gap-2 ${upgrade.owned ? 'bg-green-100 opacity-80' : 'bg-white'}`}>
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-xl text-[#000080]">{upgrade.name}</h4>
                              {upgrade.owned ? (
                                <span className="text-green-600 font-bold">OWNED</span>
                              ) : (
                                <div className="flex flex-col items-end">
                                  {upgrade.cost > 0 && <span className="text-green-700 font-bold font-mono">{upgrade.cost} Credits</span>}
                                  {upgrade.creativityCost && <span className="text-purple-700 font-bold font-mono">{upgrade.creativityCost} Creativity</span>}
                                </div>
                              )}
                            </div>
                            <p className="text-gray-600">{upgrade.description}</p>
                            {!upgrade.owned && (
                              <button 
                                className={`btn-retro mt-2 ${(credits < upgrade.cost || (upgrade.creativityCost && creativity < upgrade.creativityCost)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => buyUpgrade(upgrade)}
                                disabled={credits < upgrade.cost || (upgrade.creativityCost && creativity < upgrade.creativityCost)}
                              >
                                PURCHASE
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : mainTab === 'boardroom' ? (
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    <div className="window flex flex-col h-full">
                      <div className="bg-[#000080] text-white p-2 text-xl">BOARD ROOM</div>
                      <div className="p-4 bg-[#c0c0c0] flex-1 flex flex-col gap-4 overflow-y-auto">
                        {meetingStatus === 'setup' && (
                          <div className="panel-inset bg-white p-4 flex flex-col gap-4">
                            <h3 className="text-xl font-bold text-[#000080] border-b border-black pb-2">Schedule a Meeting</h3>
                            <div>
                              <label className="block text-lg font-bold mb-1">Meeting Topic:</label>
                              <input 
                                type="text" 
                                className="w-full border border-gray-400 p-2 text-lg" 
                                value={meetingTopic}
                                onChange={e => setMeetingTopic(e.target.value)}
                                placeholder="e.g., How to improve our app's performance"
                              />
                            </div>
                            <div>
                              <label className="block text-lg font-bold mb-1">Select Participants:</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {agents.map(agent => (
                                  <label key={agent.id} className="flex items-center gap-2 p-2 border border-gray-300 hover:bg-gray-100 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={meetingParticipantIds.includes(agent.id)}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setMeetingParticipantIds([...meetingParticipantIds, agent.id]);
                                        } else {
                                          setMeetingParticipantIds(meetingParticipantIds.filter(id => id !== agent.id));
                                        }
                                      }}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-bold">{agent.name}</span>
                                      <span className="text-xs text-gray-600">{agent.role}</span>
                                    </div>
                                  </label>
                                ))}
                                {agents.length === 0 && <span className="text-gray-500 italic">No agents hired yet.</span>}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button 
                                className="btn-retro text-xl py-3 flex-1" 
                                onClick={startMeeting}
                                disabled={!meetingTopic || meetingParticipantIds.length === 0}
                              >
                                START MEETING
                              </button>
                              <button 
                                className="btn-retro text-xl py-3 px-6" 
                                onClick={() => {
                                  setMeetingTopic('');
                                  setMeetingParticipantIds([]);
                                }}
                                disabled={!meetingTopic && meetingParticipantIds.length === 0}
                              >
                                CLEAR
                              </button>
                            </div>
                          </div>
                        )}

                        {meetingStatus === 'in_progress' && (
                          <div className="flex-1 flex flex-col gap-4">
                            <div className="panel-inset bg-white p-4 flex-1 overflow-y-auto flex flex-col gap-4">
                              <h3 className="text-xl font-bold text-[#000080] border-b border-black pb-2">Topic: {meetingTopic}</h3>
                              {meetingMessages.map((msg, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                  <img src={msg.agent.avatar} alt={msg.agent.name} className="w-12 h-12 border border-black bg-gray-200" style={{ imageRendering: 'pixelated' }} />
                                  <div className="flex-1 bg-blue-50 p-3 border border-blue-200 rounded-lg">
                                    <div className="font-bold text-sm text-[#000080] mb-1">{msg.agent.name} ({msg.agent.role})</div>
                                    <div className="text-gray-800 whitespace-pre-wrap">{msg.text}</div>
                                  </div>
                                </div>
                              ))}
                              {agents.some(a => a.status === 'thinking') && (
                                <div className="text-gray-500 italic animate-pulse">An agent is speaking...</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button 
                                className="btn-retro text-xl py-3 flex-1" 
                                onClick={concludeMeeting}
                                disabled={agents.some(a => a.status === 'thinking')}
                              >
                                CONCLUDE MEETING & SUMMARIZE
                              </button>
                              <button 
                                className="btn-retro text-xl py-3 px-6 bg-red-600 text-white" 
                                onClick={cancelMeeting}
                              >
                                CANCEL
                              </button>
                            </div>
                          </div>
                        )}

                        {meetingStatus === 'summarizing' && (
                          <div className="panel-inset bg-white p-8 flex flex-col items-center justify-center gap-4">
                            <div className="w-8 h-8 border-4 border-[#000080] border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-xl font-bold text-[#000080]">Summarizing meeting outcomes...</div>
                          </div>
                        )}

                        {meetingStatus === 'concluded' && (
                          <div className="panel-inset bg-white p-4 flex flex-col gap-4">
                            <h3 className="text-xl font-bold text-[#000080] border-b border-black pb-2">Meeting Outcomes</h3>
                            {meetingOptions.length === 0 ? (
                              <div className="text-gray-500 italic">No actionable tasks were generated.</div>
                            ) : (
                              <div className="grid grid-cols-1 gap-4">
                                {meetingOptions.map((opt, i) => (
                                  <div key={i} className="border border-gray-300 p-3 bg-gray-50 flex flex-col gap-2">
                                    <div className="font-bold text-lg">{opt.title}</div>
                                    <div className="text-sm text-gray-700">{opt.prompt}</div>
                                    <div className="text-xs text-[#000080] font-bold">Suggested Agent: {opt.suggestedAgentName || 'Any'}</div>
                                    <button 
                                      className="btn-retro text-sm py-1 mt-2"
                                      onClick={() => createMeetingTask(opt)}
                                    >
                                      CREATE TASK
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button 
                              className="btn-retro text-xl py-3 mt-4" 
                              onClick={() => {
                                setMeetingStatus('setup');
                                setMeetingTopic('');
                                setMeetingParticipantIds([]);
                                setMeetingMessages([]);
                                setMeetingOptions([]);
                              }}
                            >
                              START NEW MEETING
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : mainTab === 'files' ? (
                  <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
                    <div className="window flex flex-col h-full">
                      <div className="bg-[#000080] text-white p-2 text-xl flex flex-wrap gap-2 justify-between items-center shrink-0">
                        <span className="truncate">IDE WORKSPACE {activeRepo ? `(Linked: ${activeRepo.name})` : ''}</span>
                        {!activeRepo && githubToken && (
                          <button className="btn-retro text-sm px-2 py-1" onClick={() => setShowRepoList(true)}>
                            LINK REPO
                          </button>
                        )}
                        {!githubToken && (
                          <button className="btn-retro text-sm px-2 py-1" onClick={connectGitHub}>
                            CONNECT GITHUB
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Left Pane: File List */}
                        <div className={`flex flex-col border-r border-black bg-[#c0c0c0] ${viewingFileContent ? 'hidden lg:flex lg:w-1/3 shrink-0' : 'w-full lg:w-1/3 shrink-0'}`}>
                          <div className="p-2 border-b border-black flex flex-wrap items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <button 
                                className="btn-retro text-xs px-2 py-1 shrink-0" 
                                onClick={() => {
                                  const parts = currentPath.split('/').filter(Boolean);
                                  parts.pop();
                                  loadFiles(parts.join('/'));
                                }}
                                disabled={!currentPath}
                              >
                                UP DIR
                              </button>
                              <span className="font-mono text-sm bg-white panel-inset px-2 py-1 truncate">
                                /{currentPath}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button className="btn-retro text-xs px-2 py-1" onClick={handleCreateFile} title="New File">+ FILE</button>
                              <button className="btn-retro text-xs px-2 py-1" onClick={handleCreateFolder} title="New Folder">+ DIR</button>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                            {localFiles.filter(f => {
                                const prefix = currentPath ? `${currentPath}/` : '';
                                if (!f.path.startsWith(prefix)) return false;
                                const relativePath = f.path.substring(prefix.length);
                                return !relativePath.includes('/');
                              }).length === 0 ? (
                              <div className="text-center p-4 font-bold text-sm text-gray-600">Directory is empty.</div>
                            ) : (
                              localFiles.filter(f => {
                                const prefix = currentPath ? `${currentPath}/` : '';
                                if (!f.path.startsWith(prefix)) return false;
                                const relativePath = f.path.substring(prefix.length);
                                return !relativePath.includes('/');
                              }).map(file => (
                                <div 
                                  key={file.path} 
                                  className={`panel-inset p-2 flex items-center gap-2 cursor-pointer hover:bg-blue-100 ${viewingFileContent?.path === file.path ? 'bg-blue-200' : 'bg-white'}`}
                                  onClick={() => {
                                    if (file.type === 'dir') {
                                      loadFiles(file.path);
                                    } else {
                                      setViewingFileContent({ path: file.path, content: file.content || '' });
                                    }
                                  }}
                                >
                                  {file.type === 'dir' ? <FolderOpen size={16} className="text-yellow-600 shrink-0"/> : <FileCode size={16} className="text-blue-600 shrink-0"/>}
                                  <span className="font-mono text-sm truncate">{file.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Right Pane: File Viewer */}
                        {viewingFileContent ? (
                          <div className="flex-1 flex flex-col bg-[#c0c0c0] overflow-hidden">
                            <div className="p-2 border-b border-black flex justify-between items-center bg-[#000080] text-white shrink-0">
                              <span className="font-mono text-sm truncate">{viewingFileContent.path}</span>
                              <button onClick={() => setViewingFileContent(null)} className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs shrink-0">X</button>
                            </div>
                            <div className="flex-1 p-2 flex flex-col overflow-hidden">
                              <div className="panel-inset flex-1 bg-white overflow-auto relative flex flex-col">
                                <textarea 
                                  className="flex-1 p-2 lg:p-4 font-mono text-xs lg:text-sm text-gray-800 whitespace-pre-wrap resize-none outline-none"
                                  value={viewingFileContent.content}
                                  onChange={(e) => setViewingFileContent({ ...viewingFileContent, content: e.target.value })}
                                />
                              </div>
                              <div className="flex flex-wrap justify-end mt-2 gap-2 shrink-0">
                                <button 
                                  className="btn-retro text-sm font-bold text-blue-700 flex items-center gap-1"
                                  onClick={() => {
                                    setLocalFiles(prev => prev.map(f => 
                                      f.path === viewingFileContent.path ? { ...f, content: viewingFileContent.content } : f
                                    ));
                                    addLog(`Saved ${viewingFileContent.path} locally.`);
                                  }}
                                >
                                  <Save size={16} /> SAVE LOCAL
                                </button>
                                <button 
                                  className="btn-retro text-sm font-bold text-green-700 flex items-center gap-1"
                                  onClick={() => pushToGitHub({ title: viewingFileContent.path, resultCode: viewingFileContent.content } as Project, viewingFileContent.path)}
                                  disabled={pushingFile || !activeRepo}
                                  title={!activeRepo ? "Link a GitHub repo first" : "Push to GitHub"}
                                >
                                  <Network size={16} /> {pushingFile ? 'PUSHING...' : 'PUSH TO GITHUB'}
                                </button>
                                <button className="btn-retro text-sm" onClick={() => {
                                  navigator.clipboard.writeText(viewingFileContent.content || '');
                                  addLog('File content copied to clipboard.');
                                }}>COPY</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="hidden lg:flex flex-1 items-center justify-center text-gray-500 font-bold bg-[#c0c0c0] panel-inset m-2">
                            Select a file to view its contents
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Event Log */}
              <div className="h-32 lg:h-40 window flex flex-col shrink-0">
                <div className="bg-[#000080] text-white p-1 px-2 text-sm lg:text-lg">SYSTEM LOG</div>
                <div className="flex-1 panel-inset m-1 bg-black text-blue-400 font-mono text-xs lg:text-lg overflow-y-auto p-2 flex flex-col">
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1">{'>'} {log}</div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
          {showCompanySetup && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 lg:p-4 z-50">
            <div className="window w-full max-w-md">
              <div className="window-header">
                <span>Company_Setup.exe</span>
                <button onClick={() => setShowCompanySetup(false)} className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs">X</button>
              </div>
              <form onSubmit={handleCompanySubmit} className="p-4 flex flex-col gap-4 bg-[#c0c0c0]">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold">Company Name:</label>
                  <input name="name" defaultValue={company?.name} required className="panel-inset p-2 bg-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold">Vision:</label>
                  <textarea name="vision" defaultValue={company?.vision} required className="panel-inset p-2 bg-white h-20" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold">Mission:</label>
                  <textarea name="mission" defaultValue={company?.mission} required className="panel-inset p-2 bg-white h-20" />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" className="btn-retro" onClick={() => setShowCompanySetup(false)}>CANCEL</button>
                  <button type="submit" className="btn-retro font-bold text-[#000080]">SAVE PROFILE</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRepoList && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 lg:p-4 z-50">
            <div className="window w-full max-w-2xl h-[80vh] flex flex-col">
              <div className="window-header flex justify-between items-center">
                <span>GitHub_Repositories.exe</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreateRepo(true)} className="text-xs bg-[#000080] text-white px-2 border-t border-l border-blue-400 border-b border-r border-black">New Repo</button>
                  <button onClick={() => {
                    setGithubToken(null);
                    setGithubUsername(null);
                    setActiveRepo(null);
                    localStorage.removeItem('github_token');
                    localStorage.removeItem('github_username');
                    localStorage.removeItem('active_repo');
                    setShowRepoList(false);
                    addLog("Disconnected from GitHub.");
                  }} className="text-xs bg-red-800 text-white px-2 border-t border-l border-red-500 border-b border-r border-black">Disconnect</button>
                  <button onClick={() => setShowRepoList(false)} className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs">X</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-[#c0c0c0] flex flex-col gap-2">
                {showCreateRepo ? (
                  <form onSubmit={createRepo} className="panel-inset bg-white p-4 flex flex-col gap-3">
                    <h3 className="font-bold text-lg text-[#000080] border-b border-black pb-1">Create New Repository</h3>
                    <div>
                      <label className="block text-sm font-bold">Repository Name:</label>
                      <input 
                        required 
                        className="w-full border border-gray-400 p-1" 
                        value={newRepoForm.name}
                        onChange={e => setNewRepoForm({...newRepoForm, name: e.target.value})}
                        placeholder="e.g., my-awesome-project"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold">Description:</label>
                      <input 
                        className="w-full border border-gray-400 p-1" 
                        value={newRepoForm.description}
                        onChange={e => setNewRepoForm({...newRepoForm, description: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button type="button" className="btn-retro text-sm" onClick={() => setShowCreateRepo(false)}>Cancel</button>
                      <button type="submit" className="btn-retro text-sm font-bold text-[#000080]" disabled={loadingRepos}>
                        {loadingRepos ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </form>
                ) : loadingRepos ? (
                  <div className="text-center p-8 font-bold">Fetching repositories...</div>
                ) : repos.length === 0 ? (
                  <div className="text-center p-8 font-bold">No repositories found.</div>
                ) : (
                  repos.map(repo => (
                    <div key={repo.id} className={`panel-inset p-3 flex justify-between items-center hover:bg-gray-100 ${activeRepo?.id === repo.id ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}>
                      <div>
                        <div className="font-bold text-lg flex items-center gap-2">
                          {repo.name}
                          {repo.private && <span className="text-[10px] bg-gray-200 px-1 border border-gray-400">Private</span>}
                        </div>
                        <div className="text-sm text-gray-600 truncate max-w-md">{repo.description || 'No description'}</div>
                      </div>
                      <button 
                        className={`btn-retro text-sm ${activeRepo?.id === repo.id ? 'bg-green-200 inset-shadow' : ''}`} 
                        onClick={() => selectRepo(repo)}
                      >
                        {activeRepo?.id === repo.id ? 'ACTIVE' : 'SELECT'}
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-[#c0c0c0] border-t border-black flex justify-end">
                <button className="btn-retro" onClick={() => setShowRepoList(false)}>CLOSE</button>
              </div>
            </div>
          </div>
        )}

        {showNewProject && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 lg:p-4 z-50">
            <div className="window w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="window-header">
                <span>New_Task.exe</span>
                <button onClick={() => setShowNewProject(false)} className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs">X</button>
              </div>
              <form onSubmit={handleCreateProject} className="p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 bg-[#c0c0c0] overflow-y-auto">
                <div>
                  <label className="block text-lg lg:text-xl mb-1">Task Title:</label>
                  <input 
                    type="text" 
                    required
                    className="panel-inset w-full text-lg lg:text-xl p-2"
                    value={newProjectForm.title}
                    onChange={e => setNewProjectForm({...newProjectForm, title: e.target.value})}
                    placeholder="e.g., Login Component"
                  />
                </div>
                <div className="relative">
                  <label className="block text-lg lg:text-xl mb-1">Prompt / Requirements:</label>
                  <textarea 
                    ref={promptTextareaRef}
                    required
                    className="panel-inset w-full text-lg lg:text-xl p-2 h-24 lg:h-32 resize-none"
                    value={newProjectForm.prompt}
                    onChange={handlePromptChange}
                    placeholder="Describe what the AI agent should code... (Type @ to reference files)"
                  />
                  {mentionQuery !== null && (
                    <div className="absolute z-50 bg-white border border-black shadow-lg max-h-40 overflow-y-auto w-full mt-1">
                      {localFiles
                        .filter(f => f.type === 'file' && f.path.toLowerCase().includes(mentionQuery.toLowerCase()))
                        .map(f => (
                          <div 
                            key={f.path}
                            className="p-1 hover:bg-blue-200 cursor-pointer text-sm font-mono border-b border-gray-200 last:border-0"
                            onClick={() => {
                              const cursorPosition = promptTextareaRef.current?.selectionStart || 0;
                              const textBeforeCursor = newProjectForm.prompt.substring(0, cursorPosition);
                              const textAfterCursor = newProjectForm.prompt.substring(cursorPosition);
                              const match = textBeforeCursor.match(/(?:^|\s)@([^\s]*)$/);
                              if (match) {
                                const replaceStart = cursorPosition - match[1].length - 1;
                                const newText = newProjectForm.prompt.substring(0, replaceStart) + `@${f.path} ` + textAfterCursor;
                                setNewProjectForm({ ...newProjectForm, prompt: newText });
                                setMentionQuery(null);
                                promptTextareaRef.current?.focus();
                              }
                            }}
                          >
                            {f.path}
                          </div>
                        ))}
                      {localFiles.filter(f => f.type === 'file' && f.path.toLowerCase().includes(mentionQuery.toLowerCase())).length === 0 && (
                        <div className="p-1 text-sm font-mono text-gray-500">No matching files found.</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <label className="block text-lg lg:text-xl mb-1">Workflow Pipeline (Optional):</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {newProjectForm.pipeline.map((agentId, idx) => {
                      const a = agents.find(ag => ag.id === agentId);
                      return (
                        <div key={idx} className="flex items-center gap-1 bg-[#000080] text-white px-2 py-1 text-sm border border-black">
                          <span>{idx + 1}. {a?.name || 'Unknown'}</span>
                          <button type="button" className="text-red-400 hover:text-red-200 font-bold ml-1" onClick={() => {
                            const newPipeline = [...newProjectForm.pipeline];
                            newPipeline.splice(idx, 1);
                            setNewProjectForm({...newProjectForm, pipeline: newPipeline});
                          }}>X</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <select className="panel-inset flex-1 text-lg p-1" id="pipeline-add-select" defaultValue="">
                      <option value="" disabled>Add agent to pipeline...</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                    </select>
                    <button type="button" className="btn-retro text-sm px-2" onClick={() => {
                      const select = document.getElementById('pipeline-add-select') as HTMLSelectElement;
                      if (select.value) {
                        setNewProjectForm({...newProjectForm, pipeline: [...newProjectForm.pipeline, select.value]});
                        select.value = '';
                      }
                    }}>ADD</button>
                  </div>
                </div>
                <div className="flex justify-end gap-3 lg:gap-4 mt-2 lg:mt-4">
                  <button type="button" className="btn-retro text-lg lg:text-xl" onClick={() => setShowNewProject(false)}>CANCEL</button>
                  <button type="submit" className="btn-retro font-bold text-[#000080] text-lg lg:text-xl">CREATE TASK</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewingProject && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 lg:p-4 z-50">
            <div className="window w-full max-w-4xl h-[90vh] lg:h-[80vh] flex flex-col">
              <div className="window-header">
                <span>Code_Viewer - {viewingProject.title}</span>
                <button onClick={() => setViewingProject(null)} className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs">X</button>
              </div>
              <div className="flex-1 p-2 bg-[#c0c0c0] flex flex-col overflow-hidden">
                <div className="panel-inset flex-1 bg-white overflow-auto relative">
                  <pre className="p-2 lg:p-4 font-mono text-xs lg:text-sm text-gray-800 whitespace-pre-wrap">
                    {viewingProject.resultCode}
                  </pre>
                </div>
                
                {activeRepo && (
                  <div className="mt-2 p-2 bg-white panel-inset flex items-center gap-2">
                    <span className="font-bold text-sm text-[#000080] whitespace-nowrap">Push to {activeRepo.name}:</span>
                    <input 
                      type="text" 
                      className="flex-1 border border-gray-400 p-1 text-sm font-mono"
                      value={pushFilePath}
                      onChange={e => setPushFilePath(e.target.value)}
                      placeholder="e.g., src/components/Button.tsx"
                    />
                    <button 
                      className="btn-retro text-sm font-bold text-green-700 flex items-center gap-1"
                      onClick={() => pushToGitHub(viewingProject)}
                      disabled={pushingFile || !pushFilePath}
                    >
                      <Network size={14} /> {pushingFile ? 'PUSHING...' : 'PUSH'}
                    </button>
                  </div>
                )}

                <div className="flex justify-end mt-2 gap-2">
                  <button className="btn-retro text-sm lg:text-xl flex items-center gap-2" onClick={() => downloadCode(viewingProject)}>
                    <Download size={16} /> DOWNLOAD
                  </button>
                  <button className="btn-retro text-sm lg:text-xl" onClick={() => {
                    navigator.clipboard.writeText(viewingProject.resultCode || '');
                    addLog('Code copied to clipboard.');
                  }}>COPY CODE</button>
                  <button className="btn-retro text-sm lg:text-xl" onClick={() => setViewingProject(null)}>CLOSE</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {orgModalAgent && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 lg:p-4 z-50">
            <div className="window w-full max-w-md max-h-[95vh] flex flex-col">
              <div className="window-header">
                <span>Manage_Agent.exe</span>
                <button onClick={() => setOrgModalAgent(null)} className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black text-xs">X</button>
              </div>
              <div className="p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 bg-[#c0c0c0] overflow-y-auto">
                <div className="flex gap-2 mb-2">
                  <button 
                    className={`btn-retro flex-1 py-1 text-sm lg:text-lg ${agentModalTab === 'profile' ? 'bg-gray-400 inset-shadow' : ''}`}
                    onClick={() => setAgentModalTab('profile')}
                  >
                    Profile
                  </button>
                  <button 
                    className={`btn-retro flex-1 py-1 text-sm lg:text-lg flex justify-center items-center gap-2 ${agentModalTab === 'training' ? 'bg-gray-400 inset-shadow' : ''}`}
                    onClick={() => setAgentModalTab('training')}
                  >
                    <GraduationCap size={16} /> Training
                  </button>
                </div>

                {agentModalTab === 'profile' ? (
                  <>
                    <div className="flex flex-col gap-3 lg:gap-4 bg-white panel-inset p-2 lg:p-3">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <img src={orgModalAgent.avatar} alt={orgModalAgent.name} className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 border-2 border-black" style={{ imageRendering: 'pixelated' }} />
                        <div className="min-w-0">
                          <div className="font-bold text-xl lg:text-2xl truncate">{orgModalAgent.name}</div>
                          <div className="text-lg lg:text-xl text-[#000080] truncate">{orgModalAgent.role}</div>
                          <div className="text-gray-600 text-xs lg:text-sm truncate">Persona: {orgModalAgent.personality.name}</div>
                        </div>
                      </div>
                      
                      <div className="border-t border-black pt-2">
                        <div className="text-[#000080] font-bold mb-1 text-xs lg:text-sm">Top Skills:</div>
                        <div className="grid grid-cols-2 gap-x-3 lg:gap-x-4 gap-y-1 lg:gap-y-2">
                          {Object.entries(orgModalAgent.skills)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 4)
                            .map(([skill, val]) => (
                              <div key={skill} className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] lg:text-xs font-bold">
                                  <span className="truncate pr-1">{skill}</span>
                                  <span>{val}</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1 border border-black p-[1px]">
                                  <div className="bg-[#000080] h-full" style={{ width: `${val}%` }}></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {orgModalAgent.learnedSkills && orgModalAgent.learnedSkills.length > 0 && (
                        <div className="border-t border-black pt-2 mt-2">
                          <div className="text-[#000080] font-bold mb-1 text-xs lg:text-sm">Autoresearch Modules:</div>
                          <div className="flex flex-wrap gap-1">
                            {orgModalAgent.learnedSkills.map(skillId => {
                              const skillDef = TRAINING_SKILLS.find(s => s.id === skillId);
                              return skillDef ? (
                                <span key={skillId} className="bg-green-100 border border-green-700 text-green-800 text-[10px] px-1 font-bold">
                                  {skillDef.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="panel-inset p-3 bg-white mb-2 flex flex-col gap-2">
                      <div className="text-lg"><span className="font-bold">LLM Engine:</span> <span className="bg-gray-200 px-1 border border-gray-400">{orgModalAgent.llmModel}</span></div>
                      <div className="text-lg"><span className="font-bold">Work Style:</span> {orgModalAgent.personality.description}</div>
                      <div className="flex flex-col mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-lg">Instructions Bundle:</span>
                          {!editingInstructions ? (
                            <button className="btn-retro py-0 px-2 text-sm" onClick={() => setEditingInstructions(true)}>EDIT</button>
                          ) : (
                            <div className="flex gap-2">
                              <button className="btn-retro py-0 px-2 text-sm" onClick={() => {
                                setEditingInstructions(false);
                                setEditedBundle(orgModalAgent.instructionsBundle.files);
                              }}>CANCEL</button>
                              <button className="btn-retro py-0 px-2 text-sm font-bold text-[#000080]" onClick={saveInstructions}>SAVE</button>
                            </div>
                          )}
                        </div>
                        
                        {!editingInstructions ? (
                          <div className="w-full h-48 p-2 text-sm bg-gray-100 border border-gray-400 overflow-y-auto font-mono">
                            {Object.entries(orgModalAgent.instructionsBundle.files).map(([filename, content]) => (
                              <div key={filename} className="mb-3">
                                <div className="font-bold text-[#000080] mb-1">[{filename}]</div>
                                <div className="whitespace-pre-wrap">{content}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full h-48 overflow-y-auto flex flex-col gap-2">
                            {Object.entries(editedBundle).map(([filename, content]) => (
                              <div key={filename} className="flex flex-col">
                                <label className="font-bold text-[#000080] text-sm">[{filename}]</label>
                                <textarea 
                                  className="w-full p-2 text-sm bg-white border border-gray-400 resize-y font-mono min-h-[60px]"
                                  value={content}
                                  onChange={(e) => setEditedBundle(prev => ({...prev, [filename]: e.target.value}))}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="panel-inset p-3 bg-white">
                      <label className="block text-xl mb-2 font-bold">Department Assignment:</label>
                      <select
                        className="w-full panel-inset text-xl p-2 mb-4"
                        value={orgModalAgent.department || 'Product'}
                        onChange={(e) => moveAgent(orgModalAgent.id, e.target.value as Department, orgModalAgent.isLead || false)}
                      >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>

                      <label className="flex items-center gap-3 cursor-pointer text-xl">
                        <input
                          type="checkbox"
                          className="w-5 h-5"
                          checked={orgModalAgent.isLead || false}
                          onChange={(e) => moveAgent(orgModalAgent.id, orgModalAgent.department || 'Product', e.target.checked)}
                        />
                        <span>Set as Department Lead</span>
                      </label>
                    </div>

                    <div className="flex justify-between mt-4">
                      <button className="btn-retro bg-red-600 text-white font-bold" onClick={() => fireAgent(orgModalAgent.id)}>FIRE AGENT</button>
                      <button className="btn-retro" onClick={() => setOrgModalAgent(null)}>CLOSE</button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="bg-[#000080] text-white p-2 text-lg font-bold flex items-center gap-2">
                      <GraduationCap size={20} /> Autoresearch Training
                    </div>
                    <div className="panel-inset bg-white p-3 mb-2">
                      <p className="text-sm text-gray-700">
                        Train {orgModalAgent.name} to learn new skills. Training uses the autoresearch method to upgrade their internal knowledge base and instruction bundle.
                      </p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                      {TRAINING_SKILLS.filter(s => s.role === orgModalAgent.role || s.role === 'Any').map(skill => {
                        const isLearned = orgModalAgent.learnedSkills?.includes(skill.id);
                        const canAfford = credits >= skill.costCredits && creativity >= skill.costCreativity;
                        
                        return (
                          <div key={skill.id} className={`panel-inset p-3 flex flex-col gap-2 ${isLearned ? 'bg-green-100' : 'bg-white'}`}>
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-lg text-[#000080]">{skill.name}</h4>
                              {isLearned ? (
                                <span className="text-green-700 font-bold text-sm border border-green-700 px-1">LEARNED</span>
                              ) : (
                                <div className="flex flex-col items-end text-xs font-mono">
                                  <span className="text-green-700 font-bold">{skill.costCredits} Credits</span>
                                  <span className="text-purple-700 font-bold">{skill.costCreativity} Creativity</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{skill.description}</p>
                            <div className="text-xs font-bold text-blue-700">Impact: +{skill.impact} {orgModalAgent.role} Skill</div>
                            
                            {!isLearned && (
                              <button 
                                className={`btn-retro mt-1 text-sm py-1 ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => trainAgent(orgModalAgent, skill)}
                                disabled={!canAfford}
                              >
                                START TRAINING
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {TRAINING_SKILLS.filter(s => s.role === orgModalAgent.role || s.role === 'Any').length === 0 && (
                        <div className="text-center p-4 text-gray-500 italic">No training modules available for this role.</div>
                      )}
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <button className="btn-retro" onClick={() => setOrgModalAgent(null)}>CLOSE</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
