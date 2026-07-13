"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { AsyncPanel } from "@/components/async-panel";
import { SmartOutput } from "@/components/smart-output";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi, postJson } from "@/lib/hooks";
import { fmtMoney, fmtDate } from "@/lib/format";
import type { Decision, ProductIdea, SpendingRequest } from "@/lib/types";

function DecideButtons({
  busy,
  onDecide,
}: {
  busy: boolean;
  onDecide: (decision: Decision) => void;
}) {
  const t = useTranslations("aprovacoes");
  return (
    <div className="flex gap-2 pt-3">
      <Button
        size="lg"
        className="flex-1 font-heading bg-success text-background hover:bg-success/85"
        disabled={busy}
        onClick={() => onDecide("approved")}
      >
        <Check className="size-4 mr-1" /> {t("approve")}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="flex-1 font-heading border-danger/50 text-danger hover:bg-danger/10"
        disabled={busy}
        onClick={() => onDecide("rejected")}
      >
        <X className="size-4 mr-1" /> {t("reject")}
      </Button>
    </div>
  );
}

export default function AprovacoesPage() {
  const t = useTranslations("aprovacoes");
  const ideas = useApi<ProductIdea[]>("/api/ideas?status=pending", 45_000);
  const spending = useApi<SpendingRequest[]>("/api/spending?status=pending", 45_000);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(
    kind: "ideas" | "spending",
    id: string,
    decision: Decision,
    reload: () => void,
  ) {
    setBusyId(id);
    setError(null);
    try {
      await postJson(`/api/${kind}/decide`, { request_id: id, decision });
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("decideError"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <SectionHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
      />
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <Tabs defaultValue="ideias" className="reveal">
        <TabsList>
          <TabsTrigger value="ideias" className="font-heading">
            {t("tabIdeas")} {ideas.data?.length ? `(${ideas.data.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="gastos" className="font-heading">
            {t("tabSpending")} {spending.data?.length ? `(${spending.data.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideias" className="mt-4">
          <AsyncPanel
            loading={ideas.loading}
            error={ideas.error}
            empty={(ideas.data?.length ?? 0) === 0}
            emptyMessage={t("emptyIdeas")}
            onRetry={ideas.reload}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {ideas.data?.map((idea) => (
                <div key={idea.id} className="corner-frame rounded-md border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-lg font-semibold">{idea.product_name}</h3>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                      {fmtDate(idea.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/85">{idea.idea_summary}</p>
                  {idea.research_summary != null && (
                    <div className="mt-3 rounded-md bg-muted/40 p-3">
                      <div className="label-mono mb-1">{t("researchScoreLabel")}</div>
                      <SmartOutput data={idea.research_summary} />
                    </div>
                  )}
                  <DecideButtons
                    busy={busyId === idea.id}
                    onDecide={(d) => decide("ideas", idea.id, d, ideas.reload)}
                  />
                </div>
              ))}
            </div>
          </AsyncPanel>
        </TabsContent>

        <TabsContent value="gastos" className="mt-4">
          <p className="mb-3 font-mono text-[11px] text-muted-foreground">
            {t("spendingHint")}
          </p>
          <AsyncPanel
            loading={spending.loading}
            error={spending.error}
            empty={(spending.data?.length ?? 0) === 0}
            emptyMessage={t("emptySpending")}
            onRetry={spending.reload}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {spending.data?.map((s) => (
                <div key={s.id} className="corner-frame rounded-md border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-primary">{s.agent}</span>
                      <h3 className="font-heading text-lg font-semibold">
                        {fmtMoney(s.estimated_cost, s.currency)}
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                      {fmtDate(s.requested_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/85">
                    <span className="text-muted-foreground">{s.product} · </span>
                    {s.action}
                  </p>
                  {s.decision_note && (
                    <div className="mt-3 rounded-md border-l-2 border-primary bg-muted/40 p-3 text-xs text-foreground/80">
                      <div className="label-mono mb-1">{t("atlasNoteLabel")}</div>
                      {s.decision_note}
                    </div>
                  )}
                  <DecideButtons
                    busy={busyId === s.id}
                    onDecide={(d) => decide("spending", s.id, d, spending.reload)}
                  />
                </div>
              ))}
            </div>
          </AsyncPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
