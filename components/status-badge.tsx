import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-warning/12 text-warning border-warning/40",
  approved: "bg-success/12 text-success border-success/40",
  rejected: "bg-danger/12 text-danger border-danger/40",
  done: "bg-success/12 text-success border-success/40",
  error: "bg-danger/12 text-danger border-danger/40",
  skipped: "bg-muted text-muted-foreground border-border",
};

const LABELS: Record<string, string> = {
  pending: "pendente",
  approved: "aprovado",
  rejected: "rejeitado",
  done: "ok",
  error: "erro",
  skipped: "pulado",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase() ?? "";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        STYLES[key] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {key === "pending" && <span className="dot-pulse bg-warning" />}
      {LABELS[key] ?? status}
    </span>
  );
}
