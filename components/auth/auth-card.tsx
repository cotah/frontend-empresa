import type { ReactNode } from "react";

/** Moldura padrão das telas de auth (card corner-frame do login original). */
export function AuthCard({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="reveal corner-frame w-full max-w-sm rounded-md border border-border bg-card p-8">
        <div className="font-heading text-2xl font-bold tracking-wide">
          CAPIVA<span className="text-primary">REX</span>
        </div>
        <div className="label-mono mt-1 mb-8">{subtitle}</div>
        {children}
      </div>
    </div>
  );
}
