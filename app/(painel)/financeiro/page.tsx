"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, SendHorizonal } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { SmartOutput } from "@/components/smart-output";
import { AsyncPanel } from "@/components/async-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi, postJson } from "@/lib/hooks";
import { fmtMoney } from "@/lib/format";
import type { CfoSummary } from "@/lib/types";

export default function FinanceiroPage() {
  const t = useTranslations("financeiro");
  const cfo = useApi<CfoSummary>("/api/cfo/reports", 60_000);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<unknown>(null);
  const [asking, setAsking] = useState(false);
  const [weekly, setWeekly] = useState<unknown>(null);
  const [weeklyBusy, setWeeklyBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartData = cfo.data
    ? Object.entries(cfo.data.by_currency ?? {}).map(([currency, v]) => ({
        currency,
        total: typeof v === "number" ? v : (v?.total_gross ?? 0),
      }))
    : [];

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setError(null);
    try {
      setAnswer(await postJson("/api/cfo/ask", { question: question.trim() }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setAsking(false);
    }
  }

  async function loadWeekly() {
    setWeeklyBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cfo/weekly");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("requestError", { status: res.status }));
      setWeekly(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setWeeklyBusy(false);
    }
  }

  return (
    <div>
      <SectionHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        right={
          <Button variant="outline" onClick={loadWeekly} disabled={weeklyBusy} className="font-heading">
            <FileText className="size-4 mr-1" />
            {weeklyBusy ? t("generatingWeekly") : t("weeklyReport")}
          </Button>
        }
      />

      <AsyncPanel loading={cfo.loading} error={cfo.error} onRetry={cfo.reload}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("grossRevenue")} value={fmtMoney(cfo.data?.total_gross, "EUR")} tone="success" framed />
          <StatCard label={t("companyShare")} value={fmtMoney(cfo.data?.total_company_share, "EUR")} />
          <StatCard label={t("proLabore")} value={fmtMoney(cfo.data?.total_pro_labore_share, "EUR")} />
          <StatCard
            label={t("unclassified")}
            value={cfo.data?.pending_classification?.count ?? 0}
            hint={cfo.data?.pending_classification?.products?.join(", ") || "—"}
            tone={(cfo.data?.pending_classification?.count ?? 0) > 0 ? "warning" : "default"}
          />
        </div>

        {chartData.length > 0 && (
          <div className="reveal mt-6 rounded-md border border-border bg-card p-4">
            <div className="label-mono mb-3">{t("revenueByCurrency")}</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="currency" stroke="#7e8f88" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#7e8f88" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{ background: "#121a18", border: "1px solid #223029", borderRadius: 6 }}
                    labelStyle={{ color: "#e6eee9" }}
                  />
                  <Bar dataKey="total" fill="#e8a33d" radius={[3, 3, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </AsyncPanel>

      {/* Perguntar ao ATLAS */}
      <div className="reveal mt-8 rounded-md border border-border bg-card p-5" style={{ animationDelay: "150ms" }}>
        <div className="label-mono mb-3">{t("askAtlas")}</div>
        <form onSubmit={ask} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("askPlaceholder")}
            disabled={asking}
          />
          <Button type="submit" disabled={asking || !question.trim()}>
            {asking ? "…" : <SendHorizonal className="size-4" />}
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        {answer != null && (
          <div className="mt-4 border-t border-border pt-4">
            <SmartOutput data={answer} />
          </div>
        )}
      </div>

      {weekly != null && (
        <div className="reveal mt-6 corner-frame rounded-md border border-border bg-card p-5">
          <div className="label-mono mb-3">{t("weeklyReportTitle")}</div>
          <SmartOutput data={weekly} />
        </div>
      )}
    </div>
  );
}
