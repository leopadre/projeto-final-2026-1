import { ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isAnalyzing?: boolean;
  externalValue?: string;
}

export function ChatInput({ onSend, disabled, isAnalyzing, externalValue }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (externalValue !== undefined) {
      setValue(externalValue);
      textareaRef.current?.focus();
    }
  }, [externalValue]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border/60 bg-background/80 px-4 py-4 backdrop-blur md:px-6 md:py-5">
      <div className="mx-auto w-full max-w-3xl">
        <div
          className={cn(
            "group relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2.5 shadow-soft transition-all",
            "focus-within:border-primary/50 focus-within:shadow-elevated",
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder="Ex.: Tenho 32 anos, ganho R$ 8.000 por mês, tenho um financiamento de carro e gostaria de solicitar um empréstimo de R$ 50.000."
            className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Analisar"
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-all",
              canSend
                ? "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
                : "cursor-not-allowed bg-secondary text-muted-foreground",
            )}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Analisar</span>
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          As análises são baseadas em IA e servem como apoio à decisão de crédito.
        </p>
      </div>
    </div>
  );
}
