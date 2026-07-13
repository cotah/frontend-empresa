"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { AsyncPanel } from "@/components/async-panel";
import { SmartOutput } from "@/components/smart-output";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApi, postJson } from "@/lib/hooks";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CreationAsset,
  Decision,
  OrchestrationRun,
  PendingStatus,
} from "@/lib/types";

// "pendentes" primeiro e como default — é a fila de trabalho; decididas saem dela na hora.
// Labels vêm de t(`filters.${key}`) no render.
const FILTERS: Array<"all" | PendingStatus> = ["pending", "approved", "rejected", "all"];

/** Preview de uma peça conforme o asset_type (URLs prontas — só exibe). */
function AssetPreview({ asset }: { asset: CreationAsset }) {
  const t = useTranslations("revisao");
  const { asset_type: type, media_url: url, content_text: text, title } = asset;

  if (type === "image" || type === "social_post") {
    return (
      <div className="space-y-2">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element -- URL externa dinâmica (Supabase/CDN)
          <img
            src={url}
            alt={title ?? asset.asset_key}
            loading="lazy"
            className="max-h-72 w-full rounded-md border border-border object-contain bg-muted/30"
          />
        )}
        {text && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{text}</p>}
      </div>
    );
  }

  if (type === "video") {
    // .mp4 = vídeo final tocável; senão media_url é keyframe e o robô ainda
    // preenche o mp4 (job_set_id) — o polling da tela troca pra player sozinho.
    const isMp4 = /\.mp4$/i.test((url ?? "").split("?")[0]);
    const processing = !isMp4 && !!asset.job_set_id;
    return (
      <div className="space-y-2">
        {isMp4 && url && (
          // Vídeo vertical 9:16 — limita por altura pra não estourar o layout.
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            className="max-h-[520px] w-full rounded-xl border border-border bg-black"
          />
        )}
        {processing && (
          <div className="relative">
            {url && (
              // eslint-disable-next-line @next/next/no-img-element -- URL externa dinâmica (Supabase/CDN)
              <img
                src={url}
                alt={title ?? asset.asset_key}
                loading="lazy"
                className="max-h-[520px] w-full rounded-xl border border-border object-contain bg-black"
              />
            )}
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-sm border border-warning/40 bg-background/85 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-warning backdrop-blur-sm",
                url ? "absolute left-2 top-2" : "w-fit",
              )}
            >
              <Loader2 className="size-3 animate-spin" /> {t("processing")}
            </span>
          </div>
        )}
        {!isMp4 && !processing && url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline break-all"
          >
            <ExternalLink className="size-3 shrink-0" /> {url}
          </a>
        )}
        {text && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{text}</p>}
      </div>
    );
  }

  if (type === "email") {
    return (
      <iframe
        sandbox=""
        srcDoc={text ?? ""}
        title={title ?? t("emailPreviewTitle")}
        className="h-72 w-full rounded-md border border-border bg-white"
      />
    );
  }

  if (type === "landing" || type === "ads") {
    return (
      <div className="space-y-2">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
          >
            <ExternalLink className="size-3.5 shrink-0" /> {url}
          </a>
        )}
        {text && <SmartOutput data={text} />}
      </div>
    );
  }

  // copy / seo (e qualquer tipo desconhecido): texto
  return <SmartOutput data={text ?? url} />;
}

function RevisaoContent() {
  const t = useTranslations("revisao");
  const searchParams = useSearchParams();
  const [activeRunId, setActiveRunId] = useState<string | null>(searchParams.get("run_id"));
  const [filter, setFilter] = useState<"all" | PendingStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preparedRef = useRef<Set<string>>(new Set());

  const runs = useApi<OrchestrationRun[]>("/api/esteira/runs", 60_000);
  const assets = useApi<CreationAsset[]>(
    activeRunId ? `/api/review/assets?run_id=${activeRunId}` : null,
    15_000,
  );
  const { reload: reloadAssets, setData: setAssets } = assets;

  // Sem run selecionado (nem via ?run_id=): retoma o mais recente.
  useEffect(() => {
    if (activeRunId || !runs.data?.length) return;
    const active = runs.data.find((r) => r.status === "running" || r.status === "awaiting_gate");
    setActiveRunId((active ?? runs.data[0]).id);
  }, [activeRunId, runs.data]);

  // Ao abrir um run, chama o preparar UMA vez (idempotente — popula as peças).
  useEffect(() => {
    if (!activeRunId || preparedRef.current.has(activeRunId)) return;
    preparedRef.current.add(activeRunId);
    setPreparing(true);
    postJson("/api/review/preparar", { run_id: activeRunId })
      // Erro no preparar não bloqueia: as peças podem já existir no banco.
      .catch((e) => setError(e instanceof Error ? e.message : t("prepareError")))
      .finally(() => {
        setPreparing(false);
        reloadAssets();
      });
  }, [activeRunId, reloadAssets]);

  async function decide(asset: CreationAsset, decision: Decision) {
    setBusyId(asset.id);
    setError(null);
    try {
      await postJson("/api/review/decidir", {
        asset_id: asset.id,
        decision,
        note: notes[asset.id] || undefined,
      });
      // Atualização otimista: o card sai de "pendentes" na hora, sem esperar o polling.
      setAssets((prev) =>
        prev?.map((a) =>
          a.id === asset.id
            ? { ...a, status: decision, decision_note: notes[asset.id] || a.decision_note }
            : a,
        ) ?? prev,
      );
      reloadAssets();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("decideError"));
    } finally {
      setBusyId(null);
    }
  }

  const list = assets.data ?? [];
  const approved = list.filter((a) => a.status === "approved").length;
  const countFor = (key: "all" | PendingStatus) =>
    key === "all" ? list.length : list.filter((a) => a.status === key).length;
  const visible = filter === "all" ? list : list.filter((a) => a.status === filter);
  // Abas de decididas são só leitura (selo + nota); "todas" mantém os botões pra mudar decisão.
  const readOnly = filter === "approved" || filter === "rejected";
  const activeRun = runs.data?.find((r) => r.id === activeRunId);

  return (
    <div>
      <SectionHeader
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
      />
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {activeRunId && (
        <div className="reveal mb-8">
          {/* ── Cabeçalho do run + filtros ─────────────────────── */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-lg font-semibold">
                {activeRun?.product_name ?? t("fallbackRunTitle")}
              </h3>
              {preparing && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <Loader2 className="size-3 animate-spin text-primary" /> {t("preparing")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="label-mono mr-1">
                {t("approvedOf", { approved, total: list.length })}
              </span>
              {FILTERS.map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-sm border px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
                    filter === key
                      ? "border-primary bg-primary/12 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {t(`filters.${key}`)} {countFor(key)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Galeria ────────────────────────────────────────── */}
          <AsyncPanel
            loading={assets.loading}
            error={assets.error}
            empty={list.length === 0}
            emptyMessage={t("emptyAll")}
            onRetry={reloadAssets}
          >
            {/* Aba sem peças (ex.: tudo revisado em "pendentes") — evita grid vazio mudo. */}
            {visible.length === 0 && (
              <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
                {filter === "pending" ? t("emptyPending") : t("emptyTab")}
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((a) => (
                <div
                  key={a.id}
                  className="corner-frame flex flex-col rounded-md border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-sm border border-primary/40 bg-primary/12 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                          {a.agent}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {t.has(`types.${a.asset_type}`) ? t(`types.${a.asset_type}`) : a.asset_type}
                        </span>
                      </div>
                      {a.title && (
                        <h4 className="mt-1.5 font-heading text-sm font-semibold">{a.title}</h4>
                      )}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <div className="mt-3 flex-1">
                    <AssetPreview asset={a} />
                  </div>

                  {a.status !== "pending" && a.decision_note && (
                    <p className="mt-3 rounded-md bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
                      {t("note", { note: a.decision_note })}
                    </p>
                  )}

                  {!readOnly && (
                    <>
                      <Textarea
                        value={notes[a.id] ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                        placeholder={t("notePlaceholder")}
                        className="mt-3 min-h-12 text-sm"
                      />
                      <div className="flex gap-2 pt-3">
                        <Button
                          className="flex-1 font-heading bg-success text-background hover:bg-success/85"
                          disabled={busyId === a.id || a.status === "approved"}
                          onClick={() => decide(a, "approved")}
                        >
                          <Check className="size-4 mr-1" /> {t("approve")}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 font-heading border-danger/50 text-danger hover:bg-danger/10"
                          disabled={busyId === a.id || a.status === "rejected"}
                          onClick={() => decide(a, "rejected")}
                        >
                          <X className="size-4 mr-1" /> {t("reject")}
                        </Button>
                      </div>
                    </>
                  )}
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span className="truncate">{a.asset_key}</span>
                    <span className="shrink-0">{fmtDate(a.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </AsyncPanel>
        </div>
      )}

      {/* ── Escolher outro lançamento ───────────────────────── */}
      <div className="reveal" style={{ animationDelay: "120ms" }}>
        <div className="label-mono mb-3">{t("runs")}</div>
        <AsyncPanel
          loading={runs.loading}
          error={runs.error}
          empty={(runs.data?.length ?? 0) === 0}
          emptyMessage={t("runsEmpty")}
          onRetry={runs.reload}
        >
          <div className="overflow-hidden rounded-md border border-border">
            {runs.data?.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setActiveRunId(r.id);
                  setFilter("pending");
                }}
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

export default function RevisaoPage() {
  // useSearchParams exige Suspense em páginas pré-renderizadas (Next 16).
  return (
    <Suspense fallback={null}>
      <RevisaoContent />
    </Suspense>
  );
}
