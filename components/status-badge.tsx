import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-warning/12 text-warning border-warning/40",
  approved: "bg-success/12 text-success border-success/40",
  rejected: "bg-danger/12 text-danger border-danger/40",
  done: "bg-success/12 text-success border-success/40",
  error: "bg-danger/12 text-danger border-danger/40",
  skipped: "bg-muted text-muted-foreground border-border",
  running: "bg-primary/12 text-primary border-primary/40",
  awaiting_gate: "bg-warning/12 text-warning border-warning/40",
  aborted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  // Labels no namespace "status"; status desconhecido cai no valor cru.
  const t = useTranslations("status");
  const key = status?.toLowerCase() ?? "";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        STYLES[key] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {key === "pending" && <span className="dot-pulse bg-warning" />}
      {t.has(key) ? t(key) : status}
    </span>
  );
}
