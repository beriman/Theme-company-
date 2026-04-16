export type Role = 'CEO' | 'COO' | 'CTO' | 'CMO' | 'Frontend' | 'Backend' | 'Fullstack' | 'UI/UX' | 'QA' | 'Scrum Master' | 'Researcher' | 'DevOps' | 'Analyst' | 'Product Manager' | 'Architect' | 'Developer' | 'QA Engineer' | 'Quick Flow Solo Dev' | 'UX Designer' | 'Technical Writer';
export type Department = 'Executive' | 'Engineering' | 'Product' | 'QA';

export interface PersonalityTrait {
  name: string;
  description: string;
  timeMultiplier: number;
  promptInjection: string;
}

export interface Trait {
  name: string;
  description: string;
  effect: string; // Internal description of the effect
}

export interface RpgStats {
  vit: number; // Vitality: Endurance, affects how long they can work before resting
  agi: number; // Agility: Speed of completing tasks
  int: number; // Intelligence: Quality of work, reduces bugs
  cha: number; // Charisma: Communication, team synergy
  loy: number; // Loyalty: Chance of staying with the company
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
  traits: Trait[];
  stats: RpgStats;
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
