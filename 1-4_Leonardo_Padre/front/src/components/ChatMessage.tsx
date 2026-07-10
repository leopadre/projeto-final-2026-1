import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResultCard } from "./ResultCard";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 animate-fade-up",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      <div className={cn("flex max-w-2xl flex-col", isUser ? "items-end" : "items-start")}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-soft">
            {message.content}
          </div>
        ) : (
          <div className="text-[15px] leading-relaxed text-foreground">
            {message.content}
          </div>
        )}

        {message.analysis && <ResultCard analysis={message.analysis} />}
      </div>

      {isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
