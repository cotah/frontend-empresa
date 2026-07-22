"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, ColorInput } from "@/components/form-field";

const TOTAL_STEPS = 3;

/** Mesmos defaults do servidor — só pra iniciar os color pickers. */
const DEFAULT_COLORS = { primary: "#2563eb", bg: "#ffffff", text: "#111827" };

type Fields = {
  companyName: string;
  country: string;
  city: string;
  website: string;
  brandName: string;
  description: string;
  howItWorks: string;
  price: string;
  targetAudience: string;
  toneOfVoice: string;
  tagline: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
};

export function OnboardingWizard({
  initial,
}: {
  initial: { companyName: string; country: string; city: string; website: string };
}) {
  const t = useTranslations("onboarding");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState<Fields>({
    ...initial,
    brandName: "",
    description: "",
    howItWorks: "",
    price: "",
    targetAudience: "",
    toneOfVoice: "",
    tagline: "",
    primaryColor: DEFAULT_COLORS.primary,
    bgColor: DEFAULT_COLORS.bg,
    textColor: DEFAULT_COLORS.text,
  });

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.value }));

  const step2Ok =
    f.brandName.trim().length > 0 && f.description.trim().length > 0 && f.howItWorks.trim().length > 0;

  /**
   * Conclui o assistente enviando só os blocos preenchidos:
   * - "skipProduct" (Pular da tela 2): só empresa — sem produto não há marca.
   * - "skipBrand" (Pular da tela 3): empresa + produto, marca com defaults.
   * - "full": tudo.
   */
  async function finish(mode: "full" | "skipBrand" | "skipProduct") {
    setBusy(true);
    setError(null);
    try {
      const body = {
        companyName: f.companyName,
        country: f.country,
        city: f.city,
        website: f.website,
        ...(mode === "skipProduct"
          ? {}
          : {
              brandName: f.brandName,
              description: f.description,
              howItWorks: f.howItWorks,
              price: f.price,
              targetAudience: f.targetAudience,
            }),
        ...(mode === "full"
          ? {
              toneOfVoice: f.toneOfVoice,
              tagline: f.tagline,
              primaryColor: f.primaryColor,
              bgColor: f.bgColor,
              textColor: f.textColor,
            }
          : {}),
      };
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t("failed"));
      // Reload completo: o layout do painel revalida o status e libera a entrada.
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="reveal corner-frame w-full max-w-lg rounded-md border border-border bg-card p-8">
        <div className="font-heading text-2xl font-bold tracking-wide">
          CAPIVA<span className="text-primary">REX</span>
        </div>
        <div className="label-mono mt-1">{t("subtitle")}</div>

        {/* Barra de progresso — 3 segmentos */}
        <div className="mt-6 mb-1 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
        <div className="mb-6 font-mono text-[11px] text-muted-foreground">
          {t("step", { current: step, total: TOTAL_STEPS })}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">{t("company.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("company.hint")}</p>
            <Field label={t("company.nameLabel")} optional={t("optional")}>
              <Input value={f.companyName} onChange={set("companyName")} autoFocus />
            </Field>
            <Field label={t("company.countryLabel")} optional={t("optional")}>
              <Input value={f.country} onChange={set("country")} placeholder={t("company.countryPlaceholder")} />
              <p className="mt-1 text-xs text-muted-foreground">{t("company.countryHint")}</p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("company.cityLabel")} optional={t("optional")}>
                <Input value={f.city} onChange={set("city")} />
              </Field>
              <Field label={t("company.websiteLabel")} optional={t("optional")}>
                <Input value={f.website} onChange={set("website")} placeholder="https://" />
              </Field>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="font-heading"
                onClick={() => {
                  // Pular = descarta o que foi digitado e mantém a conta como está.
                  setF((prev) => ({ ...prev, ...initial }));
                  setStep(2);
                }}
              >
                {t("skipForNow")}
              </Button>
              <Button className="flex-1 font-heading" onClick={() => setStep(2)}>
                {t("next")}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">{t("product.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("product.hint")}</p>
            <Field label={t("product.brandNameLabel")} required>
              <Input value={f.brandName} onChange={set("brandName")} autoFocus />
            </Field>
            <Field label={t("product.descriptionLabel")} required>
              <Textarea value={f.description} onChange={set("description")} rows={3} />
            </Field>
            <Field label={t("product.howItWorksLabel")} required>
              <Textarea value={f.howItWorks} onChange={set("howItWorks")} rows={5} />
              <p className="mt-1 text-xs text-muted-foreground">{t("product.howItWorksHint")}</p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("product.priceLabel")} optional={t("optional")}>
                <Input value={f.price} onChange={set("price")} />
              </Field>
              <Field label={t("product.targetAudienceLabel")} optional={t("optional")}>
                <Input value={f.targetAudience} onChange={set("targetAudience")} />
              </Field>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="font-heading" disabled={busy} onClick={() => setStep(1)}>
                {t("back")}
              </Button>
              {/* Sem produto não há marca pra configurar: pular aqui conclui direto. */}
              <Button variant="ghost" className="font-heading" disabled={busy} onClick={() => finish("skipProduct")}>
                {busy ? t("finishBusy") : t("skipForNow")}
              </Button>
              <Button className="flex-1 font-heading" disabled={!step2Ok || busy} onClick={() => setStep(3)}>
                {t("next")}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold">{t("brand.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("brand.hint")}</p>
            <Field label={t("brand.toneLabel")} optional={t("optional")}>
              <Input value={f.toneOfVoice} onChange={set("toneOfVoice")} placeholder={t("brand.tonePlaceholder")} />
            </Field>
            <Field label={t("brand.taglineLabel")} optional={t("optional")}>
              <Input value={f.tagline} onChange={set("tagline")} />
            </Field>
            <Field label={t("brand.colorsLabel")} optional={t("optional")}>
              <div className="grid grid-cols-3 gap-3">
                <ColorInput label={t("brand.primaryLabel")} value={f.primaryColor} onChange={set("primaryColor")} />
                <ColorInput label={t("brand.bgLabel")} value={f.bgColor} onChange={set("bgColor")} />
                <ColorInput label={t("brand.textLabel")} value={f.textColor} onChange={set("textColor")} />
              </div>
            </Field>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" className="font-heading" disabled={busy} onClick={() => setStep(2)}>
                {t("back")}
              </Button>
              <Button variant="ghost" className="font-heading" disabled={busy} onClick={() => finish("skipBrand")}>
                {t("skip")}
              </Button>
              <Button className="flex-1 font-heading" disabled={busy} onClick={() => finish("full")}>
                {busy ? t("finishBusy") : t("finish")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

