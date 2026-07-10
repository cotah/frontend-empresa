"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { AsyncPanel } from "@/components/async-panel";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgentLearning, WorkLogEntry } from "@/lib/types";

/** Cores por tipo de lição (agent_learnings.kind). */
const KIND_STYLES: Record<AgentLearning["kind"], string> = {
  reflection: "bg-primary/12 text-primary border-primary/40",
  feedback: "bg-warning/12 text-warning border-warning/40",
  result: "bg-success/12 text-success border-success/40",
  example: "bg-muted text-muted-foreground border-border",
};

const KIND_LABELS: Record<AgentLearning["kind"], string> = {
  reflection: "reflexão",
  feedback: "feedback",
  result: "resultado",
  example: "exemplo",
};

export default function AtividadePage() {
  const worklog = useApi<WorkLogEntry[]>("/api/worklog?limit=100", 60_000);
  const learnings = useApi<AgentLearning[]>("/api/learnings");
  const [filter, setFilter] = useState("");

  // Filtro client-side por agente ou produto
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const rows = worklog.data ?? [];
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.agent.toLowerCase().includes(q) ||
        (r.product ?? "").toLowerCase().includes(q),
    );
  }, [worklog.data, filter]);

  return (
    <div>
      <SectionHeader
        kicker="telemetria"
        title="Atividade"
        description="O que os agentes andaram fazendo — e o que aprenderam no caminho."
      />

      <Tabs defaultValue="worklog" className="reveal">
        <TabsList>
          <TabsTrigger value="worklog" className="font-heading">
            Registro de trabalho
          </TabsTrigger>
          <TabsTrigger value="learnings" className="font-heading">
            Lições aprendidas
          </TabsTrigger>
        </TabsList>

        {/* ── Work log ─────────────────────────────────────── */}
        <TabsContent value="worklog" className="mt-4 space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por agente ou produto…"
              className="pl-8 font-mono text-xs"
            />
          </div>

          <AsyncPanel
            loading={worklog.loading}
            error={worklog.error}
            empty={filtered.length === 0}
            emptyMessage={
              filter ? "Nada bate com esse filtro." : "Nenhuma atividade registrada ainda."
            }
            onRetry={worklog.reload}
          >
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="label-mono px-3 py-2 font-normal">agente</th>
                    <th className="label-mono px-3 py-2 font-normal">produto</th>
                    <th className="label-mono px-3 py-2 font-normal">fase</th>
                    <th className="label-mono px-3 py-2 font-normal">ação</th>
                    <th className="label-mono px-3 py-2 font-normal">status</th>
                    <th className="label-mono px-3 py-2 font-normal">quando</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-heading font-semibold text-primary whitespace-nowrap">
                        {r.agent}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                        {r.product ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {r.phase ?? "—"}
                      </td>
                      <td className="px-3 py-2 max-w-md">
                        <div>{r.action}</div>
                        {r.summary && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{r.summary}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(r.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AsyncPanel>
        </TabsContent>

        {/* ── Lições aprendidas ────────────────────────────── */}
        <TabsContent value="learnings" className="mt-4">
          <AsyncPanel
            loading={learnings.loading}
            error={learnings.error}
            empty={(learnings.data?.length ?? 0) === 0}
            emptyMessage="Nenhuma lição registrada ainda."
            onRetry={learnings.reload}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {(learnings.data ?? []).map((l) => (
                <div key={l.id} className="rounded-md border border-border bg-card p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-heading font-semibold text-sm text-primary">{l.agent}</span>
                    {l.product && (
                      <span className="font-mono text-[10px] text-muted-foreground">{l.product}</span>
                    )}
                    <span
                      className={cn(
                        "ml-auto inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                        KIND_STYLES[l.kind] ?? "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {KIND_LABELS[l.kind] ?? l.kind}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{l.lesson}</p>
                  <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                    {timeAgo(l.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </AsyncPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
