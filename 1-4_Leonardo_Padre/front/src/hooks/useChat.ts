import { useCallback, useState } from "react";
import { analyzeLoan } from "@/services/api";
import type { ChatMessage } from "@/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const INITIAL_MESSAGE: ChatMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content:
    "Olá! Sou seu assistente inteligente para análise de crédito. Descreva sua situação financeira da forma que preferir e eu realizarei uma análise utilizando Inteligência Artificial.",
  createdAt: Date.now(),
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAnalyzing(true);

    try {
      const { reply, analysis } = await analyzeLoan(trimmed);
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: reply,
        analysis: analysis ?? undefined,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content:
          "Não foi possível concluir a análise agora. Tente novamente em instantes.",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMessages([{ ...INITIAL_MESSAGE, id: uid(), createdAt: Date.now() }]);
  }, []);

  return { messages, isAnalyzing, sendMessage, reset };
}
