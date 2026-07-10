import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  onPick?: (text: string) => void;
}

export function EmptyState(_props: EmptyStateProps) {
  return (
    <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elevated">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">
        Como posso analisar seu crédito hoje?
      </h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        Descreva sua situação em linguagem natural. A IA extrai os dados e roda o modelo.
      </p>
    </div>
  );
}
