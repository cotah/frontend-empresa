"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/auth/auth-card";

export default function EsqueciSenhaPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t("forgotFailed"));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forgotFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard subtitle={t("forgotTitle")}>
      {sent ? (
        <p className="text-sm text-foreground">{t("forgotSent")}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full font-heading" disabled={busy || !email}>
            {busy ? t("forgotBusy") : t("forgotSubmit")}
          </Button>
        </form>
      )}
      <div className="mt-6 font-mono text-[11px]">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          {t("backToLogin")}
        </Link>
      </div>
    </AuthCard>
  );
}
