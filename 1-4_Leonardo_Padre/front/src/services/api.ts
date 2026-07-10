import type { LoanAnalysis, ChatRequest, ChatResponse, ChatRole } from "@/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

let collectedFields: Record<string, number | null> = {};
let conversationHistory: { role: ChatRole; content: string }[] = [];

export function resetLoanSession() {
  collectedFields = {};
  conversationHistory = [];
}

export async function analyzeLoan(
  message: string
): Promise<{ reply: string; analysis: LoanAnalysis | null }> {
  const body: ChatRequest = {
    message,
    history: conversationHistory,
    collected: collectedFields,
  };

  const resp = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`API error: ${resp.status}`);
  }

  const data: ChatResponse = await resp.json();

  console.log("[analyzeLoan] response:", JSON.stringify(data, null, 2));

  // atualiza estado de sessão
  collectedFields = data.collected;
  conversationHistory.push({ role: "user", content: message });
  conversationHistory.push({ role: "assistant", content: data.reply });

  if (!data.result) {
    return { reply: data.reply, analysis: null };
  }

  const { decision, explanation } = data.result;

  const risk = decision.risk.toUpperCase() as LoanAnalysis["risk"];

  const positiveFactors = explanation.factors
    .filter((f) => f.direction === "positive")
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map((f) => f.feature.replace(/_/g, " "));

  const negativeFactors = explanation.factors
    .filter((f) => f.direction === "negative")
    .map((f) => f.feature.replace(/_/g, " "));

  const analysis: LoanAnalysis = {
    approved: decision.approved,
    probability: decision.probability,
    risk,
    reasons: [...(positiveFactors ?? []), ...(negativeFactors ?? [])],
  };

  return { reply: data.reply, analysis };
}