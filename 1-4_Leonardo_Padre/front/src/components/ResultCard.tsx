import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProbabilityBar } from "./ProbabilityBar";
import type { LoanAnalysis } from "@/types";

interface ResultCardProps {
  analysis: LoanAnalysis;
}

const riskLabel = {
  LOW: "Risco baixo",
  MEDIUM: "Risco moderado",
  HIGH: "Risco alto",
};

export function ResultCard({ analysis }: ResultCardProps) {
  const { approved, probability, risk, reasons } = analysis;

  return (
    <div
      className={cn(
        "mt-3 w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-soft animate-fade-up",
        approved ? "border-success/30" : "border-destructive/30",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-4",
          approved ? "bg-success/5" : "bg-destructive/5",
        )}
      >
        {approved ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold text-foreground">
            {approved ? "Solicitação aprovada" : "Solicitação recusada"}
          </span>
          <span className="text-xs text-muted-foreground">{riskLabel[risk]}</span>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <ProbabilityBar value={probability} approved={approved} />

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Principais fatores
          </div>
          <ul className="space-y-1.5">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-foreground">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    approved ? "bg-success" : "bg-destructive",
                  )}
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
