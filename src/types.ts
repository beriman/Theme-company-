export type Role = 'CEO' | 'COO' | 'CTO' | 'CMO' | 'Frontend' | 'Backend' | 'Fullstack' | 'UI/UX' | 'QA' | 'Scrum Master' | 'Researcher' | 'DevOps' | 'Analyst' | 'Product Manager' | 'Architect' | 'Developer' | 'QA Engineer' | 'Quick Flow Solo Dev' | 'UX Designer' | 'Technical Writer';
export type Department = 'Executive' | 'Engineering' | 'Product' | 'QA';

export interface PersonalityTrait {
  name: string;
  description: string;
  timeMultiplier: number;
  promptInjection: string;
}

export interface InstructionsBundle {
  mode: 'managed' | 'external';
  entryFile: string;
  files: Record<string, string>;
}

export type AgentStatus = 'idle' | 'working' | 'thinking' | 'offline';

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: Role;
  personality: PersonalityTrait;
  instructionsBundle: InstructionsBundle;
  skills: Record<Role, number>;
  department?: Department;
  isLead?: boolean;
  managerId?: string;
  llmModel: string;
  status: AgentStatus;
  lastHeartbeat: number;
  learnedSkills?: string[];
  customPrompt?: string;
}

export interface Project {
  id: string;
  title: string;
  prompt: string;
  assignedAgentId?: string;
  status: 'open' | 'working' | 'completed';
  resultCode?: string;
  githubRepo?: string;
  pipeline?: string[]; // Array of agent IDs
  pipelineIndex?: number;
}
