import type { LoanAnalysis } from "@/types";

/**
 * analyzeLoan
 *
 * Ponto único de comunicação com o backend de análise de crédito.
 * No futuro esta função irá:
 *  1. Enviar a mensagem do usuário para um LLM que extrai variáveis estruturadas
 *  2. Chamar a API FastAPI (model.pkl) com o JSON extraído
 *  3. Passar a resposta por um LLM que gera a explicação final
 *
 * Por enquanto retorna um mock determinístico baseado no conteúdo da mensagem.
 */
export async function analyzeLoan(message: string): Promise<LoanAnalysis> {
  await new Promise((resolve) => setTimeout(resolve, 1600));

  const lower = message.toLowerCase();
  const negativeSignals = [
    "desemprega",
    "sem renda",
    "score baixo",
    "negativado",
    "spc",
    "serasa",
    "atrasad",
  ];
  const isRisky =
    negativeSignals.some((s) => lower.includes(s)) ||
    /\b([5-9]\d{2}\.?\d{3}|\d{7,})\b/.test(lower); // valores muito altos

  if (isRisky) {
    return {
      approved: false,
      probability: 0.37,
      risk: "HIGH",
      reasons: [
        "Score de crédito abaixo do ideal",
        "Valor solicitado elevado em relação à renda",
        "Baixo patrimônio declarado",
      ],
    };
  }

  return {
    approved: true,
    probability: 0.91,
    risk: "LOW",
    reasons: [
      "Boa renda mensal comprovada",
      "Excelente score de crédito",
      "Patrimônio compatível com o valor solicitado",
    ],
  };
}
