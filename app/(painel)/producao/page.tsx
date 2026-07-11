"use client";

import { useEffect, useState } from "react";
import { Check, DoorOpen, Loader2, Rocket, StepForward, X } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { AsyncPanel } from "@/components/async-panel";
import { SmartOutput } from "@/components/smart-output";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApi, postJson } from "@/lib/hooks";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Decision, GateApproval, OrchestrationRun } from "@/lib/types";

/**
 * Passos da esteira (Bloco de Junção): fases intercaladas com portões.
 * `aliases` cobre variações do valor de `phase` vindo do banco (matching
 * tolerante — minúsculo, sem acento).
 */
const STEPS: Array<
  | { kind: "phase"; key: string; label: string; aliases: string[]; slow?: boolean }
  | { kind: "gate"; num: number; label: string }
> = [
  { kind: "phase", key: "produto", label: "Produto", aliases: ["produto", "product", "venus"] },
  { kind: "gate", num: 2, label: "Portão 2" },
  { kind: "phase", key: "marca", label: "Marca", aliases: ["marca", "brand"] },
  { kind: "gate", num: 3, label: "Portão 3" },
  {
    kind: "phase",
    key: "estrategia",
    label: "Estratégia",
    aliases: ["estrategia", "strategy", "orion"],
  },
  { kind: "gate", num: 4, label: "Portão 4" },
  {
    kind: "phase",
    key: "criacao",
    label: "Criação",
    aliases: ["criacao", "creation", "forge"],
    slow: true,
  },
  {
    kind: "phase",
    key: "publicacao",
    label: "Publicação",
    aliases: ["publicacao", "publish", "publication", "provision"],
  },
  { kind: "gate", num: 5, label: "Portão 5" },
];

/** minúsculo + sem acento, pra casar phase/gate do banco com os passos. */
function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Índice do passo atual no stepper (-1 sem run; STEPS.length = concluído). */
function currentStepIndex(run: OrchestrationRun | null): number {
  if (!run) return -1;
  if (run.status === "done") return STEPS.length;
  const phase = norm(run.phase);
  const phaseIdx = STEPS.findIndex(
    (s) => s.kind === "phase" && s.aliases.some((a) => phase.includes(a)),
  );
  if (run.status === "awaiting_gate") {
    const gateNum = Number(/(\d)/.exec(norm(run.gate))?.[1]);
    const gateIdx = STEPS.findIndex((s) => s.kind === "gate" && s.num === gateNum);
    if (gateIdx >= 0) return gateIdx;
    if (phaseIdx >= 0 && STEPS[phaseIdx + 1]?.kind === "gate") return phaseIdx + 1;
  }
  return phaseIdx;
}

export default function ProducaoPage() {
  const [productName, setProductName] = useState("");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [busyGateId, setBusyGateId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const runs = useApi<OrchestrationRun[]>("/api/esteira/runs", 30_000);
  const run = useApi<OrchestrationRun>(
    activeRunId ? `/api/esteira/run?id=${activeRunId}` : null,
    5_000,
  );
  const gates = useApi<GateApproval[]>(
    activeRunId ? `/api/esteira/gates?run_id=${activeRunId}&status=pending` : null,
    7_000,
  );

  // Sem run selecionado: retoma o mais recente ainda em andamento (ou o último).
  useEffect(() => {
    if (activeRunId || !runs.data?.length) return;
    const active = runs.data.find((r) => r.status === "running" || r.status === "awaiting_gate");
    setActiveRunId((active ?? runs.data[0]).id);
  }, [activeRunId, runs.data]);

  const current = currentStepIndex(run.data ?? null);
  const currentStep = STEPS[current];
  const pendingGates = gates.data ?? [];
  const inCriacao =
    advancing || (run.data?.status === "running" && currentStep?.kind === "phase" && currentStep.slow);
  const canAdvance =
    !!run.data && run.data.status === "awaiting_gate" && !gates.loading && pendingGates.length === 0;

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const resp = await postJson<{ run_id?: string; id?: string }>("/api/esteira/iniciar", {
        product_name: productName.trim(),
      });
      const id = resp.run_id ?? resp.id;
      if (!id) throw new Error("Esteira não devolveu run_id");
      setActiveRunId(id);
      setProductName("");
      runs.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar");
    } finally {
      setStarting(false);
    }
  }

  async function advance() {
    if (!activeRunId) return;
    setAdvancing(true);
    setError(null);
    try {
      await postJson("/api/esteira/avancar", { run_id: activeRunId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao avançar");
    } finally {
      setAdvancing(false);
      run.reload();
      gates.reload();
      runs.reload();
    }
  }

  async function decideGate(gate: GateApproval, decision: Decision) {
    setBusyGateId(gate.id);
    setError(null);
    try {
      await postJson("/api/esteira/portao", {
        run_id: gate.run_id,
        gate: gate.gate,
        decision,
        note: notes[gate.id] || undefined,
      });
      gates.reload();
      run.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao decidir portão");
    } finally {
      setBusyGateId(null);
    }
  }

  return (
    <div>
      <SectionHeader
        kicker="esteira"
        title="Linha de Produção"
        description="Dispara o lançamento de um produto e acompanha as fases da esteira em tempo real."
      />
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {/* ── Iniciar lançamento ──────────────────────────────── */}
      <div className="reveal corner-frame mb-8 max-w-xl rounded-md border border-border bg-card p-5">
        <div className="label-mono mb-3">iniciar lançamento</div>
        <div className="flex gap-2">
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && productName.trim() && !starting) start();
            }}
            placeholder="Nome do produto…"
            className="flex-1"
          />
          <Button
            className="font-heading"
            disabled={starting || !productName.trim()}
            onClick={start}
          >
            <Rocket className="size-4 mr-1" />
            {starting ? "Iniciando…" : "Iniciar"}
          </Button>
        </div>
      </div>

      {/* ── Run atual ───────────────────────────────────────── */}
      {activeRunId && (
        <div className="reveal mb-8" style={{ animationDelay: "80ms" }}>
          <div className="label-mono mb-3">lançamento em acompanhamento</div>
          <AsyncPanel loading={run.loading} error={run.error} onRetry={run.reload}>
            {run.data && (
              <div className="corner-frame rounded-md border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-semibold">{run.data.product_name}</h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={run.data.status} />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {fmtDate(run.data.created_at)}
                    </span>
                  </div>
                </div>

                {/* Stepper das fases + portões */}
                <ol className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
                  {STEPS.map((step, i) => {
                    const state = i < current ? "done" : i === current ? "current" : "next";
                    return (
                      <li
                        key={step.label}
                        className={cn(
                          "rounded-md border p-2.5 text-center",
                          step.kind === "gate" ? "border-warning/40 bg-warning/5" : "bg-card",
                          state === "done" && "border-success/50 opacity-80",
                          state === "current" && "border-primary bg-primary/10",
                          state === "next" && step.kind !== "gate" && "border-border opacity-60",
                        )}
                      >
                        <div className="flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {step.kind === "gate" ? (
                            <DoorOpen className="size-3 text-warning" />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                          {state === "done" && <Check className="size-3 text-success" />}
                          {state === "current" &&
                            (run.data?.status === "running" ? (
                              <Loader2 className="size-3 animate-spin text-primary" />
                            ) : (
                              <span className="dot-pulse bg-warning" />
                            ))}
                        </div>
                        <div
                          className={cn(
                            "mt-1 font-heading text-xs font-semibold",
                            state === "current" && "text-primary",
                          )}
                        >
                          {step.label}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {/* Fase atual crua (fallback quando não casa com o stepper) */}
                {run.data.phase && current === -1 && (
                  <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                    fase atual: {run.data.phase}
                    {run.data.gate ? ` · portão: ${run.data.gate}` : ""}
                  </p>
                )}

                {/* Loading claro da Criação (~6 min, 5 agentes) */}
                {inCriacao && (
                  <div className="mt-4 flex items-center gap-3 rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-primary">Fase rodando…</span> a{" "}
                      <span className="font-semibold">Criação</span> executa 8 agentes
                      (FORGE→VANTA→PRISM→PULSAR→LUMEN→VITALIS→SEQUOIA→NOVA) e leva{" "}
                      <span className="font-semibold">~10–12 minutos</span>. Pode deixar a tela
                      aberta — o status atualiza sozinho.
                    </p>
                  </div>
                )}

                {run.data.last_summary && (
                  <div className="mt-4 rounded-md bg-muted/40 p-3">
                    <div className="label-mono mb-1">último resumo</div>
                    <SmartOutput data={run.data.last_summary} />
                  </div>
                )}

                {/* Avançar: portão aprovado, próxima fase liberada */}
                {canAdvance && (
                  <Button
                    size="lg"
                    className="mt-4 w-full font-heading"
                    disabled={advancing}
                    onClick={advance}
                  >
                    <StepForward className="size-4 mr-1" />
                    {advancing ? "Rodando próxima fase…" : "Avançar — rodar próxima fase"}
                  </Button>
                )}
              </div>
            )}
          </AsyncPanel>

          {/* ── Portões pendentes ───────────────────────────── */}
          {run.data?.status === "awaiting_gate" && pendingGates.length > 0 && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {pendingGates.map((gate) => (
                <div
                  key={gate.id}
                  className="corner-frame rounded-md border border-warning/40 bg-warning/5 p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="size-4 text-warning" />
                      <h3 className="font-heading text-lg font-semibold">
                        {gate.gate}
                        {gate.phase ? (
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {gate.phase}
                          </span>
                        ) : null}
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                      {fmtDate(gate.created_at)}
                    </span>
                  </div>
                  {gate.summary && (
                    <div className="mt-3 rounded-md bg-muted/40 p-3">
                      <SmartOutput data={gate.summary} />
                    </div>
                  )}
                  <Textarea
                    value={notes[gate.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [gate.id]: e.target.value }))}
                    placeholder="Nota da decisão (opcional)…"
                    className="mt-3 min-h-16 text-sm"
                  />
                  <div className="flex gap-2 pt-3">
                    <Button
                      size="lg"
                      className="flex-1 font-heading bg-success text-background hover:bg-success/85"
                      disabled={busyGateId === gate.id}
                      onClick={() => decideGate(gate, "approved")}
                    >
                      <Check className="size-4 mr-1" /> Aprovar
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 font-heading border-danger/50 text-danger hover:bg-danger/10"
                      disabled={busyGateId === gate.id}
                      onClick={() => decideGate(gate, "rejected")}
                    >
                      <X className="size-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Lançamentos recentes ────────────────────────────── */}
      <div className="reveal" style={{ animationDelay: "160ms" }}>
        <div className="label-mono mb-3">lançamentos recentes</div>
        <AsyncPanel
          loading={runs.loading}
          error={runs.error}
          empty={(runs.data?.length ?? 0) === 0}
          emptyMessage="Nenhum lançamento ainda — inicia o primeiro aí em cima 🚀"
          onRetry={runs.reload}
        >
          <div className="overflow-hidden rounded-md border border-border">
            {runs.data?.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRunId(r.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted/40",
                  r.id === activeRunId && "bg-primary/10",
                )}
              >
                <span className="font-heading font-semibold">{r.product_name}</span>
                <span className="flex items-center gap-3">
                  {r.phase && (
                    <span className="font-mono text-[11px] text-muted-foreground">{r.phase}</span>
                  )}
                  <StatusBadge status={r.status} />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {fmtDate(r.created_at)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </AsyncPanel>
      </div>
    </div>
  );
}
