"use client";

import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";

/**
 * Renderiza a resposta de um agente sem conhecer o shape exato:
 * string => markdown; objeto com campo de texto conhecido => markdown + JSON
 * colapsável; resto => JSON formatado.
 */
const TEXT_FIELDS = ["reply", "answer", "report", "result", "summary", "veredito", "raw"];

export function Markdown({ children }: { children: string }) {
  return (
    <div className="md-body text-sm leading-relaxed">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

export function SmartOutput({ data }: { data: unknown }) {
  const t = useTranslations("common");
  if (data === null || data === undefined) return null;

  if (typeof data === "string") return <Markdown>{data}</Markdown>;

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const field = TEXT_FIELDS.find((f) => typeof obj[f] === "string" && (obj[f] as string).trim());
    if (field) {
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== field));
      return (
        <div className="space-y-3">
          <Markdown>{obj[field] as string}</Markdown>
          {Object.keys(rest).length > 0 && (
            <details className="group">
              <summary className="label-mono cursor-pointer select-none hover:text-foreground">
                {t("fullData")}
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
                {JSON.stringify(rest, null, 2)}
              </pre>
            </details>
          )}
        </div>
      );
    }
  }

  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
