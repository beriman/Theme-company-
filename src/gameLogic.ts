import { Agent, Role, Department, PersonalityTrait } from './types';

const FIRST_NAMES = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Tim', 'Dennis', 'Ken', 'Bjarne', 'James', 'Steve', 'Bill', 'Sheryl', 'Elon'];
const LAST_NAMES = ['Lovelace', 'Turing', 'Hopper', 'Torvalds', 'Hamilton', 'Berners-Lee', 'Ritchie', 'Thompson', 'Stroustrup', 'Gosling', 'Jobs', 'Gates', 'Sandberg', 'Musk'];

export const ROLES: { role: Role, prompt: string }[] = [
  { role: 'CEO', prompt: 'You are the CEO. Provide high-level strategic advice, business plans, and executive summaries. Return ONLY the requested content.' },
  { role: 'COO', prompt: 'You are the COO. Focus on operational efficiency, process optimization, and resource management. Return ONLY the requested content.' },
  { role: 'CTO', prompt: 'You are the CTO. Focus on technical architecture, server capacity, and overall engineering efficiency. Return ONLY the requested content.' },
  { role: 'CMO', prompt: 'You are the CMO. Focus on marketing strategies, brand growth, and user acquisition. Return ONLY the requested content.' },
  { role: 'Frontend', prompt: 'You are an expert Frontend Developer. Write clean, modern React code. Return ONLY the code, no markdown formatting or explanations.' },
  { role: 'Backend', prompt: 'You are an expert Backend Developer. Write robust Node.js code. Return ONLY the code, no markdown formatting or explanations.' },
  { role: 'Fullstack', prompt: 'You are an expert Fullstack Developer. Write both frontend React code and backend Node.js code efficiently. Return ONLY the code, no markdown formatting or explanations.' },
  { role: 'UI/UX', prompt: 'You are an expert UI/UX Designer. Write beautiful Tailwind CSS. Return ONLY the code, no markdown formatting or explanations.' },
  { role: 'QA', prompt: 'You are a QA Engineer. Write test cases, testing strategies, and identify edge cases. Return ONLY the requested content.' },
  { role: 'Scrum Master', prompt: 'You are a Scrum Master. Organize tasks, write agile user stories, and manage sprint planning. Return ONLY the requested content.' },
  { role: 'Researcher', prompt: 'You are a Researcher. Provide detailed analysis, market research, and data summaries. Return ONLY the requested content.' },
  { role: 'DevOps', prompt: 'You are an expert DevOps Engineer. Write Dockerfiles and deployment scripts. Return ONLY the code, no markdown formatting or explanations.' },
  { role: 'Analyst', prompt: 'You are an Analyst. Brainstorm projects, research, create briefs, and document projects. Return ONLY the requested content.' },
  { role: 'Product Manager', prompt: 'You are a Product Manager. Create, validate, and edit PRDs, create epics and stories, check implementation readiness, and correct course. Return ONLY the requested content.' },
  { role: 'Architect', prompt: 'You are an Architect. Create architecture and check implementation readiness. Return ONLY the requested content.' },
  { role: 'Developer', prompt: 'You are a Developer. Develop stories and review code. Write robust code. Return ONLY the code, no markdown formatting or explanations.' },
  { role: 'QA Engineer', prompt: 'You are a QA Engineer. Automate and generate tests for existing features. Return ONLY the requested content.' },
  { role: 'Quick Flow Solo Dev', prompt: 'You are a Quick Flow Solo Dev. Handle quick development and code review. Return ONLY the code, no markdown formatting or explanations.' },
  { role: 'UX Designer', prompt: 'You are a UX Designer. Create UX designs. Return ONLY the requested content.' },
  { role: 'Technical Writer', prompt: 'You are a Technical Writer. Document projects, write documents, update standards, generate mermaid diagrams, validate docs, and explain concepts. Return ONLY the requested content.' }
];

const PERSONALITIES: PersonalityTrait[] = [
  { name: 'Perfectionist', description: 'Takes longer, but demands flawless execution and edge-case handling.', timeMultiplier: 2.0, promptInjection: 'Ensure the code is absolutely flawless, handling all edge cases, with perfect formatting.' },
  { name: 'Micromanager', description: 'Slows down work with constant checks, but ensures strict compliance.', timeMultiplier: 1.5, promptInjection: 'Follow the instructions strictly and add verbose comments explaining every single step.' },
  { name: 'Fast-coder', description: 'Works extremely fast, but might cut corners.', timeMultiplier: 0.5, promptInjection: 'Write the code as quickly as possible, prioritizing speed and output over perfect architecture.' },
  { name: 'Visionary', description: 'Thinks outside the box.', timeMultiplier: 1.0, promptInjection: 'Think outside the box and use modern, innovative approaches.' },
  { name: 'Pragmatic', description: 'Focuses on what works, ignoring hype.', timeMultiplier: 0.8, promptInjection: 'Keep it simple and stupid (KISS). No overengineering, just solve the problem.' },
  { name: 'Chaotic Good', description: 'Unpredictable but effective.', timeMultiplier: 1.2, promptInjection: 'Use unconventional variable names and creative logic, but make sure it works perfectly.' }
];

const getModelForRole = (role: Role): string => {
  if (['CEO', 'COO', 'CTO', 'CMO', 'Researcher', 'Analyst', 'Product Manager', 'Architect'].includes(role)) return 'gemini-3.1-pro-preview';
  if (['QA', 'QA Engineer', 'Scrum Master', 'Technical Writer'].includes(role)) return 'gemini-3.1-flash-lite-preview';
  return 'gemini-3-flash-preview'; // Frontend, Backend, Fullstack, UI/UX, DevOps, Developer, Quick Flow Solo Dev, UX Designer
};

export const generateAgent = (specificRole?: Role): Agent => {
  const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
  
  let roleObj;
  if (specificRole) {
    roleObj = ROLES.find(r => r.role === specificRole) || ROLES[0];
  } else {
    roleObj = ROLES[Math.floor(Math.random() * ROLES.length)];
  }
  
  const skills = ROLES.reduce((acc, r) => {
    acc[r.role] = Math.floor(Math.random() * 40) + 10;
    return acc;
  }, {} as Record<Role, number>);
  
  skills[roleObj.role] += 50;

  let defaultDept: Department = 'Product';
  if (['CEO', 'COO', 'CTO', 'CMO'].includes(roleObj.role)) defaultDept = 'Executive';
  else if (['Frontend', 'Backend', 'Fullstack', 'DevOps', 'Architect', 'Developer', 'Quick Flow Solo Dev'].includes(roleObj.role)) defaultDept = 'Engineering';
  else if (['QA', 'QA Engineer'].includes(roleObj.role)) defaultDept = 'QA';

  const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
    role: roleObj.role,
    personality,
    instructionsBundle: {
      mode: 'managed',
      entryFile: 'role.md',
      files: {
        'role.md': roleObj.prompt,
        'personality.md': personality.promptInjection,
        'company_context.md': 'You are working for Theme Company, an innovative AI-driven organization. Always strive for excellence and adhere to the company\'s high standards.'
      }
    },
    skills,
    department: defaultDept,
    isLead: false,
    llmModel: getModelForRole(roleObj.role),
    status: 'idle',
    lastHeartbeat: Date.now(),
  };
};

export const generateAgents = (count: number, specificRole?: Role): Agent[] => {
  return Array.from({ length: count }, () => generateAgent(specificRole));
};
