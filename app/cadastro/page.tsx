"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/auth/auth-card";

export default function CadastroPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const emailsMatch =
    email.trim().toLowerCase() === emailConfirm.trim().toLowerCase();
  const showMismatch = emailConfirm.length > 0 && !emailsMatch;
  const canSubmit =
    !busy && !!name.trim() && !!phone.trim() && !!email && emailsMatch && !!password && termsAccepted;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          termsAccepted,
          marketingOptIn,
          locale,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t("signupFailed"));
      if (json.needsConfirmation) {
        setNeedsConfirmation(true);
        setBusy(false);
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("signupFailed"));
      setBusy(false);
    }
  }

  return (
    <AuthCard subtitle={t("signupTitle")}>
      {needsConfirmation ? (
        <p className="text-sm text-foreground">{t("signupCheckEmail")}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            type="tel"
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="email"
            placeholder={t("emailConfirmPlaceholder")}
            value={emailConfirm}
            onChange={(e) => setEmailConfirm(e.target.value)}
            aria-invalid={showMismatch}
          />
          {showMismatch && <p className="text-xs text-danger">{t("emailMismatch")}</p>}
          <Input
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>
              {t.rich("termsAccept", {
                link: (chunks) => (
                  <Link
                    href="/termos"
                    target="_blank"
                    className="text-primary underline hover:no-underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>{t("marketingOptIn")}</span>
          </label>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full font-heading" disabled={!canSubmit}>
            {busy ? t("signupBusy") : t("signupSubmit")}
          </Button>
        </form>
      )}
      <div className="mt-6 font-mono text-[11px]">
        <Link href="/login" className="text-primary hover:underline">
          {t("hasAccount")}
        </Link>
      </div>
    </AuthCard>
  );
}
