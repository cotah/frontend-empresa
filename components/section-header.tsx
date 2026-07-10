import type { ReactNode } from "react";

/** Cabeçalho padrão das telas: kicker técnico + título display. */
export function SectionHeader({
  kicker,
  title,
  description,
  right,
}: {
  kicker: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="reveal mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="label-mono mb-1 flex items-center gap-2">
          <span className="inline-block h-px w-6 bg-primary" />
          {kicker}
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-wide">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {right}
    </div>
  );
}
