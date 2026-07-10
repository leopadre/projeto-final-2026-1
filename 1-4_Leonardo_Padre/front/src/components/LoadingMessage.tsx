import { Sparkles } from "lucide-react";
import { TypingIndicator } from "./TypingIndicator";

export function LoadingMessage() {
  return (
    <div className="flex w-full gap-3 animate-fade-up">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-1.5 pt-1.5">
        <span className="text-xs font-medium text-muted-foreground">Analisando…</span>
        <TypingIndicator />
      </div>
    </div>
  );
}
