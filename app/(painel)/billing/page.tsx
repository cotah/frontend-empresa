"use client";

import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/section-header";
import { AsyncPanel } from "@/components/async-panel";
import { StatCard } from "@/components/stat-card";
import { useApi } from "@/lib/hooks";

interface Billing {
  capsBalance: number;
  plan: string;
}

export default function BillingPage() {
  const t = useTranslations("billing");
  const { data, error, loading, reload } = useApi<Billing>("/api/billing");

  return (
    <div>
      <SectionHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
      />

      <AsyncPanel loading={loading} error={error} onRetry={reload}>
        <div className="reveal grid gap-4 sm:grid-cols-2">
          <StatCard
            label={t("capsLabel")}
            value={(data?.capsBalance ?? 0).toLocaleString()}
            tone="success"
            framed
          />
          <StatCard
            label={t("planLabel")}
            value={<span className="capitalize">{data?.plan ?? "—"}</span>}
            framed
          />
        </div>
      </AsyncPanel>

      {/* Últimos pagamentos — placeholder até o Stripe entrar (Fase 2). */}
      <div className="reveal mt-8" style={{ animationDelay: "120ms" }}>
        <h2 className="label-mono mb-3">{t("paymentsTitle")}</h2>
        <div className="corner-frame rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
          {t("paymentsEmpty")}
        </div>
      </div>
    </div>
  );
}
