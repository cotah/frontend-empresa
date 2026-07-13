"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/auth/auth-card";

export default function CadastroPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <Input
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full font-heading" disabled={busy || !email || !password}>
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
