export type LoanRisk = "LOW" | "MEDIUM" | "HIGH";

export type LoanReason = string;

export interface LoanDecision {
  approved: boolean;
  probability: number;
  risk: LoanRisk;
  reasons: LoanReason[];
}

export type LoanAnalysis = LoanDecision;

export interface ChatRequest {
  message: string;
  history: { role: ChatRole; content: string }[];
  collected: Record<string, number | null>;
}

export interface ChatResponse {
  reply: string;
  collected: Record<string, number | null>;
  result: {
    decision: {
      approved: boolean;
      probability: number;
      risk: string;
    };
    explanation: {
      factors: {
        feature: string;
        value: number;
        impact: number;
        direction: string;
      }[];
    };
  } | null;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  analysis?: LoanAnalysis;
  createdAt: number;
}
