"use client";

import { useState } from "react";
import { DoorOpen, Info, Rocket } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { SmartOutput } from "@/components/smart-output";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * As 9 fases da esteira CAPIVAREX. `gate: true` = fase com portão de
 * aprovação (só avança com OK do Henrique ou do ATLAS).
 */
const PHASES = [
  { name: "Inteligência", gate: false },
  { name: "Ideia", gate: true },
  { name: "Produto", gate: true },
  { name: "Marca", gate: true },
  { name: "Estratégia", gate: true },
  { name: "Criação", gate: false },
  { name: "Publicação", gate: true },
  { name: "Operação", gate: false },
  { name: "Medição", gate: false },
];

export default function ProducaoPage() {
  const [productName, setProductName] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await postJson("/api/orchestrator/launch", { product_name: productName.trim() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeader
        kicker="esteira"
        title="Linha de Produção"
        description="Dispara o lançamento de um produto e acompanha as fases da esteira."
      />

      {/* ── Disparar lançamento ─────────────────────────────── */}
      <div className="reveal corner-frame mb-8 max-w-xl rounded-md border border-border bg-card p-5">
        <div className="label-mono mb-3">disparar lançamento</div>
        <div className="flex gap-2">
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && productName.trim() && !busy) launch();
            }}
            placeholder="Nome do produto…"
            className="flex-1"
          />
          <Button
            className="font-heading"
            disabled={busy || !productName.trim()}
            onClick={launch}
          >
            <Rocket className="size-4 mr-1" />
            {busy ? "Disparando…" : "Lançar"}
          </Button>
        </div>
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        {result != null && (
          <div className="mt-4 max-h-96 overflow-y-auto border-t border-border pt-4">
            <SmartOutput data={result} />
          </div>
        )}
      </div>

      {/* ── Mapa das fases (estático) ───────────────────────── */}
      <div className="reveal" style={{ animationDelay: "120ms" }}>
        <div className="label-mono mb-3">mapa da esteira — 9 fases</div>
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {PHASES.map((phase, i) => (
            <li
              key={phase.name}
              className={cn(
                "relative rounded-md border p-3 text-center",
                phase.gate ? "border-warning/40 bg-warning/5" : "border-border bg-card",
              )}
            >
              <div className="font-mono text-[10px] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-1 font-heading text-sm font-semibold">{phase.name}</div>
              {phase.gate && (
                <div className="mt-1.5 flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-wider text-warning">
                  <DoorOpen className="size-3" /> portão
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* Nota de honestidade: tracking em tempo real ainda não existe */}
        <div className="mt-4 flex items-start gap-3 rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
          <Info className="size-4 shrink-0 mt-0.5 text-primary" />
          <p className="text-muted-foreground">
            <span className="font-semibold text-primary">Mapa estático por enquanto.</span>{" "}
            O acompanhamento em tempo real de cada lançamento (fase atual, portões pendentes)
            chega com o <span className="font-mono text-xs">Bloco de Junção</span> — tabela{" "}
            <span className="font-mono text-xs">orchestration_runs</span> e os endpoints 🟡 do spec.
          </p>
        </div>
      </div>
    </div>
  );
}
