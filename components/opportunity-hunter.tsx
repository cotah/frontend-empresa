"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Coins, Search } from "lucide-react";
import { AsyncPanel } from "@/components/async-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi, postJson, putJson } from "@/lib/hooks";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HuntFrequency, HuntSettings } from "@/lib/types";

const FREQUENCIES: HuntFrequency[] = ["manual", "daily", "weekly", "monthly"];

/**
 * Configuração do Caçador de Oportunidades: liga/desliga, frequência, tema
 * e disparo manual. Lê/grava no backend Busca via /api/busca/hunt/*.
 */
export function OpportunityHunter({
  suggestedTopic,
  suggestionLoading,
}: {
  /** Público/produto da marca — vira sugestão de tema quando não há tema salvo. */
  suggestedTopic?: string;
  /** Enquanto true, segura o skeleton pra montar o form já com a sugestão pronta. */
  suggestionLoading?: boolean;
}) {
  const settings = useApi<HuntSettings>("/api/busca/hunt/settings");

  return (
    <AsyncPanel
      loading={settings.loading || Boolean(suggestionLoading)}
      error={settings.error}
      onRetry={settings.reload}
    >
      {settings.data && (
        <HunterForm
          initial={settings.data}
          suggestedTopic={suggestedTopic}
          lastRunAt={settings.data.last_run_at}
          nextRunAt={settings.data.next_run_at}
          onSettingsUpdate={settings.setData}
          reloadSettings={settings.reload}
        />
      )}
    </AsyncPanel>
  );
}

/** Form montado só depois que as settings chegam — o estado inicial vem delas. */
function HunterForm({
  initial,
  suggestedTopic,
  lastRunAt,
  nextRunAt,
  onSettingsUpdate,
  reloadSettings,
}: {
  initial: HuntSettings;
  suggestedTopic?: string;
  lastRunAt: string | null | undefined;
  nextRunAt: string | null | undefined;
  onSettingsUpdate: (s: HuntSettings) => void;
  reloadSettings: () => void;
}) {
  const t = useTranslations("hunter");

  const [enabled, setEnabled] = useState(Boolean(initial.enabled));
  const [frequency, setFrequency] = useState<HuntFrequency>(
    FREQUENCIES.includes(initial.frequency) ? initial.frequency : "manual",
  );
  const [topic, setTopic] = useState(initial.topic || suggestedTopic || "");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setNotice(null);
    setActionError(null);
    try {
      const updated = await putJson<HuntSettings>("/api/busca/hunt/settings", {
        enabled,
        frequency,
        topic: topic.trim(),
      });
      onSettingsUpdate(updated);
      setNotice(t("saved"));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setNotice(null);
    setActionError(null);
    try {
      await postJson("/api/busca/hunt/run", {});
      setNotice(t("runStarted"));
      reloadSettings();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-5 space-y-4">
      {/* Toggle ligado/desligado */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{enabled ? t("enabled") : t("disabled")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t("toggleLabel")}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            enabled ? "bg-primary" : "border border-border bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform",
              enabled && "translate-x-5",
            )}
          />
        </button>
      </div>

      {/* Frequência */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("frequencyLabel")}</p>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={frequency === f ? "default" : "outline"}
              onClick={() => setFrequency(f)}
            >
              {t(`freq.${f}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Tema */}
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t("topicLabel")}</p>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t("topicPlaceholder")}
        />
      </div>

      {/* Ações + aviso de Caps */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving || running} className="font-heading">
          {saving ? t("saving") : t("save")}
        </Button>
        <Button onClick={runNow} disabled={saving || running} variant="outline">
          <Search className="size-4 mr-1" />
          {running ? t("runningNow") : t("runNow")}
        </Button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Coins className="size-3.5 shrink-0" />
          {t("capsWarning")}
        </span>
      </div>

      {notice && <p className="text-xs text-primary">{notice}</p>}
      {actionError && <p className="text-xs text-danger">{actionError}</p>}

      {/* Última / próxima rodada */}
      <div className="flex flex-wrap gap-x-8 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <span>
          {t("lastRun")}: <span className="font-mono text-foreground/80">{fmtDate(lastRunAt)}</span>
        </span>
        <span>
          {t("nextRun")}: <span className="font-mono text-foreground/80">{fmtDate(nextRunAt)}</span>
        </span>
      </div>
    </div>
  );
}
