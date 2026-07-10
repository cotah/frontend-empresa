import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Card de métrica do cockpit (com moldura HUD opcional). */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  framed = false,
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  framed?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-4",
        framed && "corner-frame",
        className,
      )}
    >
      <div className="label-mono">{label}</div>
      <div className={cn("mt-2 font-heading text-2xl font-bold tabular-nums", toneClass)}>
        {value}
      </div>
      {hint && <div className="mt-1 font-mono text-[11px] text-muted-foreground">{hint}</div>}
      {children}
    </div>
  );
}
