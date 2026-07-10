import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { LoadingMessage } from "./LoadingMessage";
import { EmptyState } from "./EmptyState";
import { useChat } from "@/hooks/useChat";

export function Chat() {
  const { messages, isAnalyzing, sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [prefill, setPrefill] = useState<string | undefined>();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isAnalyzing]);

  const showEmptyHints = messages.length <= 1;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {isAnalyzing && <LoadingMessage />}
          {showEmptyHints && !isAnalyzing && (
            <EmptyState onPick={(t) => setPrefill(t + " ")} />
          )}
        </div>
      </div>
      <ChatInput
        onSend={sendMessage}
        disabled={isAnalyzing}
        isAnalyzing={isAnalyzing}
        externalValue={prefill}
      />
    </div>
  );
}
