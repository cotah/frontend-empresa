"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreditCard, Plug, Plus } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { AsyncPanel } from "@/components/async-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, ColorInput } from "@/components/form-field";
import { useApi, postJson, patchJson } from "@/lib/hooks";
import type { BrandContext } from "@/lib/types";

/** Mesmos defaults do onboarding — só pra iniciar os color pickers. */
const DEFAULT_COLORS = { primary: "#2563eb", bg: "#ffffff", text: "#111827" };

type SaveState = "idle" | "saving" | "saved" | "error";

type CompanyFields = { name: string; country: string; city: string; website: string };

type ProductFields = {
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

const EMPTY_PRODUCT: ProductFields = {
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
};

function rowToFields(row: BrandContext): ProductFields {
  return {
    brandName: row.brand_name ?? "",
    description: row.description ?? "",
    howItWorks: row.how_it_works ?? "",
    price: row.price ?? "",
    targetAudience: row.target_audience ?? "",
    toneOfVoice: row.tone_of_voice ?? "",
    tagline: row.tagline ?? "",
    primaryColor: row.primary_color ?? DEFAULT_COLORS.primary,
    bgColor: row.bg_color ?? DEFAULT_COLORS.bg,
    textColor: row.text_color ?? DEFAULT_COLORS.text,
  };
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const brands = useApi<BrandContext[]>("/api/brands");
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <SectionHeader kicker={t("kicker")} title={t("title")} description={t("description")} />

      <div className="space-y-8 max-w-3xl">
        {/* Bloco 1 — Empresa */}
        <CompanyBlock />

        {/* Bloco 2 — Produtos / Marcas */}
        <section className="reveal" style={{ animationDelay: "60ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">{t("products.title")}</h2>
            {!adding && (
              <Button variant="outline" size="sm" className="font-heading" onClick={() => setAdding(true)}>
                <Plus className="size-4 mr-1" /> {t("products.add")}
              </Button>
            )}
          </div>

          <AsyncPanel loading={brands.loading} error={brands.error} onRetry={brands.reload}>
            <div className="space-y-4">
              {adding && (
                <ProductCard
                  isNew
                  initial={EMPTY_PRODUCT}
                  onDone={() => {
                    setAdding(false);
                    brands.reload();
                  }}
                  onCancel={() => setAdding(false)}
                />
              )}
              {(brands.data?.length ?? 0) === 0 && !adding && (
                <div className="corner-frame rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
                  {t("products.empty")}{" "}
                  <button className="text-primary hover:underline" onClick={() => setAdding(true)}>
                    {t("products.add")}
                  </button>
                </div>
              )}
              {brands.data?.map((row) => (
                <ProductCard key={row.product ?? row.id} product={row.product} initial={rowToFields(row)} />
              ))}
            </div>
          </AsyncPanel>
        </section>

        {/* Seções futuras — espaço já reservado pra não refazer depois. */}
        <section className="reveal" style={{ animationDelay: "120ms" }}>
          <h2 className="font-heading text-lg font-semibold mb-3">{t("more.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="corner-frame rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Plug className="size-4 text-muted-foreground" />
                <span className="font-heading text-sm font-semibold">{t("more.connectionsTitle")}</span>
                <span className="ml-auto font-mono text-[10px] rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground">
                  {t("more.soon")}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("more.connectionsDesc")}</p>
            </div>
            <div className="corner-frame rounded-md border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <span className="font-heading text-sm font-semibold">{t("more.billingTitle")}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("more.billingDesc")}</p>
              <Link href="/billing" className="mt-2 inline-block text-xs text-primary hover:underline">
                {t("more.billingCta")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Empresa: prefill do /api/account, salvar direto em accounts. */
function CompanyBlock() {
  const t = useTranslations("settings");
  const account = useApi<CompanyFields>("/api/account");
  return (
    <section className="reveal">
      <h2 className="font-heading text-lg font-semibold mb-3">{t("companyTitle")}</h2>
      <AsyncPanel loading={account.loading} error={account.error} onRetry={account.reload}>
        {account.data && (
          <CompanyForm
            initial={{
              name: account.data.name ?? "",
              country: account.data.country ?? "",
              city: account.data.city ?? "",
              website: account.data.website ?? "",
            }}
          />
        )}
      </AsyncPanel>
    </section>
  );
}

/** Formulário só monta com o prefill pronto — estado inicial vem por prop, sem efeito. */
function CompanyForm({ initial }: { initial: CompanyFields }) {
  const t = useTranslations("settings");
  const tOb = useTranslations("onboarding");
  const [f, setF] = useState<CompanyFields>(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof CompanyFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setState("idle");
    setF((prev) => ({ ...prev, [key]: e.target.value }));
  };

  async function save() {
    setState("saving");
    setError(null);
    try {
      await patchJson("/api/account", f);
      setState("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setState("error");
    }
  }

  return (
    <div className="corner-frame rounded-md border border-border bg-card p-6 space-y-4">
      <Field label={tOb("company.nameLabel")}>
        <Input value={f.name} onChange={set("name")} />
      </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tOb("company.countryLabel")}>
              <Input value={f.country} onChange={set("country")} />
            </Field>
            <Field label={tOb("company.cityLabel")}>
              <Input value={f.city} onChange={set("city")} />
            </Field>
          </div>
          <Field label={tOb("company.websiteLabel")}>
            <Input value={f.website} onChange={set("website")} placeholder="https://" />
          </Field>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex items-center gap-3">
            <Button className="font-heading" disabled={state === "saving"} onClick={save}>
              {state === "saving" ? t("saving") : t("save")}
            </Button>
        {state === "saved" && <span className="text-xs text-success">{t("saved")}</span>}
      </div>
    </div>
  );
}

/** Um produto (edição) ou o formulário de cadastro (isNew). */
function ProductCard({
  product,
  initial,
  isNew,
  onDone,
  onCancel,
}: {
  product?: string;
  initial: ProductFields;
  isNew?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("settings");
  const tOb = useTranslations("onboarding");
  const [f, setF] = useState<ProductFields>(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof ProductFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setState("idle");
    setF((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Contrato do produto: os 3 campos essenciais sempre juntos (igual ao onboarding).
  const canSave =
    f.brandName.trim().length > 0 && f.description.trim().length > 0 && f.howItWorks.trim().length > 0;

  async function save() {
    setState("saving");
    setError(null);
    try {
      if (isNew) {
        await postJson("/api/brands", f);
        onDone?.();
      } else {
        await patchJson("/api/brands", { ...f, product });
        setState("saved");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
      setState("error");
    }
  }

  return (
    <div className="corner-frame rounded-md border border-border bg-card p-6 space-y-4">
      {isNew ? (
        <h3 className="font-heading text-sm font-semibold">{t("products.newTitle")}</h3>
      ) : (
        <div className="font-mono text-[11px] text-muted-foreground">{product}</div>
      )}
      <Field label={tOb("product.brandNameLabel")} required>
        <Input value={f.brandName} onChange={set("brandName")} />
      </Field>
      <Field label={tOb("product.descriptionLabel")} required>
        <Textarea value={f.description} onChange={set("description")} rows={3} />
      </Field>
      <Field label={tOb("product.howItWorksLabel")} required>
        <Textarea value={f.howItWorks} onChange={set("howItWorks")} rows={5} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tOb("product.priceLabel")}>
          <Input value={f.price} onChange={set("price")} />
        </Field>
        <Field label={tOb("product.targetAudienceLabel")}>
          <Input value={f.targetAudience} onChange={set("targetAudience")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tOb("brand.toneLabel")}>
          <Input value={f.toneOfVoice} onChange={set("toneOfVoice")} />
        </Field>
        <Field label={tOb("brand.taglineLabel")}>
          <Input value={f.tagline} onChange={set("tagline")} />
        </Field>
      </div>
      <Field label={tOb("brand.colorsLabel")}>
        <div className="grid grid-cols-3 gap-3">
          <ColorInput label={tOb("brand.primaryLabel")} value={f.primaryColor} onChange={set("primaryColor")} />
          <ColorInput label={tOb("brand.bgLabel")} value={f.bgColor} onChange={set("bgColor")} />
          <ColorInput label={tOb("brand.textLabel")} value={f.textColor} onChange={set("textColor")} />
        </div>
      </Field>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <Button className="font-heading" disabled={!canSave || state === "saving"} onClick={save}>
          {state === "saving" ? t("saving") : t("save")}
        </Button>
        {isNew && (
          <Button variant="ghost" className="font-heading" disabled={state === "saving"} onClick={onCancel}>
            {t("products.cancel")}
          </Button>
        )}
        {state === "saved" && <span className="text-xs text-success">{t("saved")}</span>}
      </div>
    </div>
  );
}
