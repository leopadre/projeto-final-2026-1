import { Plus, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PREVIOUS_ANALYSES = [
  "João Silva",
  "Maria Oliveira",
  "Empresa XPTO",
  "Financiamento Casa",
];

interface SidebarProps {
  onNewAnalysis: () => void;
  activeIndex?: number;
}

export function Sidebar({ onNewAnalysis, activeIndex = -1 }: SidebarProps) {
  return (
    <aside className="hidden md:flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Loan AI
          </span>
          <span className="text-[11px] text-muted-foreground">Analyzer</span>
        </div>
      </div>

      <div className="px-3">
        <Button
          onClick={onNewAnalysis}
          className="w-full justify-start gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft"
        >
          <Plus className="h-4 w-4" />
          Nova análise
        </Button>
      </div>

      <div className="mt-6 px-3">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Análises anteriores
        </p>
        <nav className="flex flex-col gap-0.5">
          {PREVIOUS_ANALYSES.map((label, i) => (
            <button
              key={label}
              type="button"
              className={cn(
                "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                activeIndex === i && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 text-[11px] text-muted-foreground">
        <div className="rounded-lg border border-sidebar-border bg-background/50 p-3">
          <p className="font-medium text-sidebar-foreground">Powered by AI</p>
          <p className="mt-1 leading-relaxed">
            Modelo de machine learning para análise de crédito em tempo real.
          </p>
        </div>
      </div>
    </aside>
  );
}
