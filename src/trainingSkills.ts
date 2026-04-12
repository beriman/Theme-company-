import { Role } from './types';

export interface TrainingSkill {
  id: string;
  name: string;
  description: string;
  costCredits: number;
  costCreativity: number;
  impact: number;
  role: Role | 'Any';
}

export const TRAINING_SKILLS: TrainingSkill[] = [
  // Frontend
  { id: 'ts_advanced', name: 'Advanced TypeScript', description: 'Deep dive into TS type system. autoresearch: "TypeScript advanced patterns"', costCredits: 500, costCreativity: 50, impact: 10, role: 'Frontend' },
  { id: 'react_concurrent', name: 'React Concurrent Mode', description: 'Mastering React 18 features. autoresearch: "React 18 concurrent rendering"', costCredits: 800, costCreativity: 80, impact: 15, role: 'Frontend' },
  { id: 'webgl_basics', name: 'WebGL & Three.js', description: '3D rendering on the web. autoresearch: "WebGL and Three.js fundamentals"', costCredits: 1200, costCreativity: 120, impact: 20, role: 'Frontend' },

  // Backend
  { id: 'microservices', name: 'Microservices Architecture', description: 'Designing scalable backend systems. autoresearch: "Microservices design patterns"', costCredits: 1000, costCreativity: 100, impact: 20, role: 'Backend' },
  { id: 'graphql_mastery', name: 'GraphQL Mastery', description: 'Advanced GraphQL schema design. autoresearch: "GraphQL advanced schema design"', costCredits: 700, costCreativity: 70, impact: 15, role: 'Backend' },
  { id: 'db_optimization', name: 'Database Optimization', description: 'Query tuning and indexing. autoresearch: "SQL database optimization techniques"', costCredits: 900, costCreativity: 90, impact: 18, role: 'Backend' },

  // UI/UX
  { id: 'design_systems', name: 'Design Systems', description: 'Building scalable design systems. autoresearch: "Design systems architecture"', costCredits: 600, costCreativity: 60, impact: 15, role: 'UI/UX' },
  { id: 'accessibility', name: 'Web Accessibility (a11y)', description: 'Making apps accessible to everyone. autoresearch: "Web accessibility best practices"', costCredits: 500, costCreativity: 50, impact: 10, role: 'UI/UX' },

  // QA
  { id: 'e2e_testing', name: 'E2E Testing with Cypress', description: 'Automated end-to-end testing. autoresearch: "Cypress E2E testing strategies"', costCredits: 600, costCreativity: 60, impact: 15, role: 'QA' },
  { id: 'chaos_engineering', name: 'Chaos Engineering', description: 'Testing system resilience. autoresearch: "Chaos engineering principles"', costCredits: 1500, costCreativity: 150, impact: 25, role: 'QA' },

  // DevOps
  { id: 'k8s_mastery', name: 'Kubernetes Mastery', description: 'Advanced container orchestration. autoresearch: "Kubernetes advanced orchestration"', costCredits: 1200, costCreativity: 120, impact: 25, role: 'DevOps' },
  { id: 'ci_cd_pipelines', name: 'Advanced CI/CD', description: 'Building robust deployment pipelines. autoresearch: "CI/CD pipeline optimization"', costCredits: 800, costCreativity: 80, impact: 15, role: 'DevOps' },

  // General / Any
  { id: 'general_ai', name: 'AI Assisted Development', description: 'Using AI to write better code. autoresearch: "AI assisted software engineering"', costCredits: 1000, costCreativity: 100, impact: 20, role: 'Any' },
  { id: 'system_design', name: 'System Design', description: 'Designing large scale systems. autoresearch: "Large scale system design"', costCredits: 1500, costCreativity: 150, impact: 25, role: 'Any' },
  { id: 'clean_code', name: 'Clean Code Practices', description: 'Writing maintainable and readable code. autoresearch: "Clean code principles"', costCredits: 400, costCreativity: 40, impact: 10, role: 'Any' },
];
