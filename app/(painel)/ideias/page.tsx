"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { AsyncPanel } from "@/components/async-panel";
import { StatusBadge } from "@/components/status-badge";
import { SmartOutput } from "@/components/smart-output";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useApi, postJson } from "@/lib/hooks";
import { fmtDate } from "@/lib/format";
import type { BrandContext, BuscaOpportunity, ProductIdea } from "@/lib/types";

interface BuscaList {
  count: number;
  opportunities: BuscaOpportunity[];
}

export default function IdeiasPage() {
  const ideas = useApi<ProductIdea[]>("/api/ideas");
  const busca = useApi<BuscaList>("/api/busca/opportunities");
  const brands = useApi<BrandContext[]>("/api/brands");

  const [ideaText, setIdeaText] = useState("");
  const [verdict, setVerdict] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [dlgError, setDlgError] = useState<string | null>(null);

  async function evaluate() {
    if (!ideaText.trim()) return;
    setBusy(true);
    setDlgError(null);
    setVerdict(null);
    try {
      setVerdict(await postJson("/api/ceo/idea", { idea: ideaText.trim() }));
      ideas.reload();
    } catch (e) {
      setDlgError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeader
        kicker="banco de ideias"
        title="Estoque de Ideias"
        description="De onde saem os lançamentos: ideias internas, garimpo da Busca e marcas ativas."
        right={
          <Dialog>
            <DialogTrigger render={<Button className="font-heading" />}>
              <Sparkles className="size-4 mr-1" /> Avaliar nova ideia
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-heading">Modo Ideia — HELIOS avalia (go/no-go)</DialogTitle>
              </DialogHeader>
              <Textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Descreva a ideia/produto…"
                className="min-h-28"
                disabled={busy}
              />
              <Button onClick={evaluate} disabled={busy || !ideaText.trim()} className="font-heading">
                {busy ? "HELIOS avaliando… (pode levar ~1min)" : "Mandar pro CEO"}
              </Button>
              {dlgError && <p className="text-xs text-danger">{dlgError}</p>}
              {verdict != null && (
                <div className="max-h-72 overflow-y-auto rounded-md border border-border bg-muted/40 p-3">
                  <SmartOutput data={verdict} />
                </div>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      {/* Ideias internas */}
      <section className="reveal">
        <h2 className="font-heading text-lg font-semibold mb-3">Ideias internas</h2>
        <AsyncPanel
          loading={ideas.loading}
          error={ideas.error}
          empty={(ideas.data?.length ?? 0) === 0}
          emptyMessage="Nenhuma ideia registrada ainda."
          onRetry={ideas.reload}
        >
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {ideas.data?.map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="font-heading font-semibold w-40 shrink-0 truncate">{i.product_name}</span>
                <span className="flex-1 truncate text-foreground/80">{i.idea_summary}</span>
                <StatusBadge status={i.status} />
                <span className="font-mono text-[11px] text-muted-foreground w-24 text-right shrink-0">
                  {fmtDate(i.created_at)}
                </span>
              </div>
            ))}
          </div>
        </AsyncPanel>
      </section>

      {/* Oportunidades da Busca */}
      <section className="reveal mt-8" style={{ animationDelay: "120ms" }}>
        <h2 className="font-heading text-lg font-semibold mb-3">Oportunidades garimpadas (Busca)</h2>
        <AsyncPanel
          loading={busca.loading}
          error={busca.error}
          empty={(busca.data?.opportunities?.length ?? 0) === 0}
          emptyMessage="Nenhuma oportunidade no garimpo ainda."
          onRetry={busca.reload}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {busca.data?.opportunities?.map((o) => (
              <div key={o.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium leading-snug flex-1">{o.title}</h3>
                  {o.score_total != null && (
                    <span className="font-heading text-lg font-bold text-primary tabular-nums shrink-0">
                      {Number(o.score_total).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </AsyncPanel>
      </section>

      {/* Marcas ativas */}
      <section className="reveal mt-8" style={{ animationDelay: "200ms" }}>
        <h2 className="font-heading text-lg font-semibold mb-3">Produtos / marcas ativos</h2>
        <AsyncPanel
          loading={brands.loading}
          error={brands.error}
          empty={(brands.data?.length ?? 0) === 0}
          emptyMessage="Nenhuma marca criada ainda."
          onRetry={brands.reload}
        >
          <div className="flex flex-wrap gap-2">
            {brands.data?.map((b, idx) => (
              <span
                key={(b.id as string) ?? idx}
                className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-heading text-sm text-primary"
              >
                {(b.product_name as string) ?? (b.product_slug as string) ?? "produto"}
              </span>
            ))}
          </div>
        </AsyncPanel>
      </section>
    </div>
  );
}
