"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { AsyncPanel } from "@/components/async-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/hooks";
import { fmtMoney, timeAgo } from "@/lib/format";
import type { ApprovalsCount, CfoSummary, WorkLogEntry } from "@/lib/types";

export default function HomePage() {
  const t = useTranslations("dashboard");
  const cfo = useApi<CfoSummary>("/api/cfo/reports", 60_000);
  const counts = useApi<ApprovalsCount>("/api/approvals/count", 45_000);
  const worklog = useApi<WorkLogEntry[]>("/api/worklog?limit=8", 60_000);

  return (
    <div>
      <SectionHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        right={
          <Button render={<Link href="/reuniao" />} className="font-heading">
            <MessagesSquare className="size-4 mr-1" /> {t("quickMeeting")}
          </Button>
        }
      />

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="reveal" style={{ animationDelay: "60ms" }}>
          <StatCard
            label={t("grossCash")}
            value={cfo.data ? fmtMoney(cfo.data.total_gross, "EUR") : "—"}
            hint={
              cfo.data
                ? t("transactions", { count: cfo.data.transaction_count })
                : cfo.error ?? t("loading")
            }
            tone="success"
            framed
          />
        </div>
        <div className="reveal" style={{ animationDelay: "120ms" }}>
          <StatCard
            label={t("companyShare")}
            value={cfo.data ? fmtMoney(cfo.data.total_company_share, "EUR") : "—"}
            hint={
              cfo.data
                ? t("proLabore", { value: fmtMoney(cfo.data.total_pro_labore_share, "EUR") })
                : undefined
            }
          />
        </div>
        <div className="reveal" style={{ animationDelay: "180ms" }}>
          <StatCard
            label={t("pendings")}
            value={counts.data ? counts.data.total : "—"}
            hint={
              counts.data
                ? t("pendingBreakdown", { ideas: counts.data.ideas, spending: counts.data.spending })
                : counts.error ?? undefined
            }
            tone={(counts.data?.total ?? 0) > 0 ? "warning" : "default"}
          >
            {(counts.data?.total ?? 0) > 0 && (
              <Link
                href="/aprovacoes"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {t("reviewNow")} <ArrowRight className="size-3" />
              </Link>
            )}
          </StatCard>
        </div>
        <div className="reveal" style={{ animationDelay: "240ms" }}>
          <StatCard
            label={t("unclassified")}
            value={cfo.data ? cfo.data.pending_classification?.count ?? 0 : "—"}
            hint={
              cfo.data && (cfo.data.pending_classification?.count ?? 0) > 0
                ? t("toClassify", { value: fmtMoney(cfo.data.pending_classification.total_gross, "EUR") })
                : t("allClassified")
            }
            tone={(cfo.data?.pending_classification?.count ?? 0) > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      {/* Atividade recente */}
      <div className="reveal mt-8" style={{ animationDelay: "300ms" }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">{t("recentActivity")}</h2>
          <Link href="/atividade" className="text-xs text-muted-foreground hover:text-primary">
            {t("seeAll")}
          </Link>
        </div>
        <AsyncPanel
          loading={worklog.loading}
          error={worklog.error}
          empty={(worklog.data?.length ?? 0) === 0}
          emptyMessage={t("emptyActivity")}
          onRetry={worklog.reload}
        >
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {worklog.data?.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="font-mono text-xs text-primary w-24 shrink-0 truncate">
                  {entry.agent}
                </span>
                <span className="flex-1 truncate text-foreground/90">
                  {entry.summary ?? entry.action}
                </span>
                {entry.product && (
                  <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">
                    {entry.product}
                  </span>
                )}
                <StatusBadge status={entry.status} />
                <span className="font-mono text-[11px] text-muted-foreground w-20 text-right shrink-0">
                  {timeAgo(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        </AsyncPanel>
      </div>
    </div>
  );
}
