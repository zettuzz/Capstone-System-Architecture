export interface Message {
  role: 'user' | 'assistant';
  content: string;
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

export interface InterviewInstruction {
  action: 'create_node' | 'update_node' | 'search_research' | 'grade_project' | 'complete_project_review' | 'generate_blueprint';
  nodeTitle?: string;
  nodeSummary?: string;
  nodeType?: 'topic' | 'research' | 'idea';
  phase?: InterviewPhase;
  parentNodeId?: string;
  query?: string;
  sourceNodeId?: string;
  finalGrade?: string;
  feedback?: string;
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
  parentMessageCount?: number;
  onToggleExpand: (id: string) => void;
  onAddMessage: (id: string, message: Message) => void;
  onSuggestNode: (parentId: string, title: string) => void;
  onNodeCreate?: (instruction: InterviewInstruction) => void;
  onDeleteSubtree?: (id: string) => void;
  onUndoNode?: (id: string) => void;
}