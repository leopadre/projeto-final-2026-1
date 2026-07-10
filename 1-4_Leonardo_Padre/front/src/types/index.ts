export type LoanRisk = "LOW" | "MEDIUM" | "HIGH";

export type LoanReason = string;

export interface LoanDecision {
  approved: boolean;
  probability: number;
  risk: LoanRisk;
  reasons: LoanReason[];
}

export type LoanAnalysis = LoanDecision;

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  analysis?: LoanAnalysis;
  createdAt: number;
}
