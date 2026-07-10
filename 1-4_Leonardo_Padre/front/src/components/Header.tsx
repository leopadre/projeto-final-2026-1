import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold">Loan AI Analyzer</span>
      </div>
      <div className="hidden md:flex flex-col">
        <h1 className="text-sm font-semibold tracking-tight">
          Assistente de Análise de Crédito
        </h1>
        <p className="text-xs text-muted-foreground">
          Descreva sua situação — a IA cuida do resto.
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Modelo online
      </span>
    </header>
  );
}
