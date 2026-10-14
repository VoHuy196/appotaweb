export type ScopeLevel = 'GROUP' | 'COMPANY' | 'DEPARTMENT';
export type DocStatus = 'ACTIVE' | 'EXPIRED' | 'DRAFT';
export type AnswerStatus = 'SUCCESS' | 'ABSTAIN' | 'CONFLICT';

export interface User {
  userId: string;
  username: string;
  password?: string;
  email: string;
  fullName: string;
  avatarColor: string;
  company: string;
  department: string;
  role: string;
  roleLevel: number; // 1 Junior .. 4 Director
  clearance: number; // 1 Public, 2 Internal, 3 Confidential
  description: string;
  groundTruthNote?: string; // chỉ dùng cho kiểm thử
}

export interface KnowledgeDoc {
  docId: string;
  title: string;
  section: string;
  version: string;
  topic: string;
  scopeLevel: ScopeLevel;
  targetCompany: string; // 'ALL' hoặc tên công ty
  targetDept: string; // 'ALL' hoặc tên phòng ban
  minRoleLevel: number;
  security: number;
  status: DocStatus;
  effectiveDate: string;
  expirationDate: string | null;
  value: number;
  unit: string;
  isFloor: boolean;
  owner: string;
  issuer: string;
  content: string;
}

export interface TraceStep {
  step: string;
  message: string;
  kind: 'info' | 'block' | 'drop' | 'pick' | 'warn';
}

export interface Citation {
  docId: string;
  version: string;
  title: string;
  section: string;
  effectiveDate: string;
  owner: string;
  issuer: string;
  value: number;
  unit: string;
}

export interface Answer {
  status: AnswerStatus;
  text: string;
  value: number | null;
  unit?: string;
  topic: string | null;
  appliesTo?: string;
  citations: Citation[];
  warnings: string[];
  trace: TraceStep[];
}

export interface ChatHistoryItem {
  id: string;
  timestamp: string;
  question: string;
  asOf: string;
  answer: Answer;
}
