import { cn } from "@/lib/utils";

interface ProbabilityBarProps {
  value: number; // 0..1
  approved: boolean;
}

export function ProbabilityBar({ value, approved }: ProbabilityBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Probabilidade</span>
        <span className="font-semibold tabular-nums text-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            approved ? "bg-success" : "bg-destructive",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
