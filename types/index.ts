export interface StatusPill {
  label: string;
  type: 'success' | 'warning';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  statusPills?: StatusPill[];
  contentAfterPills?: string;
}

export interface Evaluation {
  title: string;
  score: number;
  feasibility: 'High' | 'Medium' | 'Low';
  timeframe: string;
  teamSize: number;
  suggestedStack: string[];
  improvements: string[];
  researchGap: string;
  researchQuestions: string[];
  existingSystems?: string[];
  githubRepos?: GitHubRepo[];
  schedule?: ScheduleItem[];
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  updatedAt: string;
}

export interface ScheduleItem {
  week: number;
  title: string;
  tasks: string[];
  milestone?: string;
}

export interface StudyCard {
  id: string;
  question: string;
  answer: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReview: number;
  deck: string;
}

export interface InterviewInstruction {
  action: 'create_node' | 'update_node' | 'search_research' | 'grade_project';
  nodeTitle?: string;
  nodeSummary?: string;
  nodeType?: 'topic' | 'research' | 'idea';
  parentNodeId?: string;
  query?: string;
}

export type InterviewPhase = 'problem' | 'system_design' | 'tech_assessment' | 'deep_dive' | 'research' | 'complete';

export interface WorkspaceNodeData extends Record<string, unknown> {
  title: string;
  nodeType: 'idea' | 'topic' | 'research' | 'blueprint';
  messages: Message[];
  summary?: string;
  phase?: InterviewPhase;
  searchContext?: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onAddMessage: (id: string, message: Message) => void;
  onSuggestNode: (parentId: string, title: string) => void;
  onNodeCreate?: (instruction: InterviewInstruction) => void;
}

export interface WorkspaceNode {
  id: string;
  type: 'ideaNode' | 'blueprintNode';
  position: { x: number; y: number };
  data: WorkspaceNodeData;
}

export interface WorkspaceEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface EvaluationRow {
  id: string;
  session_id: string;
  user_id: string;
  title: string;
  score: number;
  feasibility: 'High' | 'Medium' | 'Low';
  timeframe: string;
  team_size: number;
  suggested_stack: string[];
  improvements: string[];
  research_gap: string;
  research_questions: string[];
  existing_systems: string[];
  github_repos: GitHubRepo[];
  schedule: ScheduleItem[];
  created_at: string;
}

export interface StudyCardRow {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: number;
  last_review: number;
  deck: string;
  created_at: string;
  updated_at: string;
}