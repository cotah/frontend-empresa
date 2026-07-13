"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/auth/auth-card";

function RedefinirForm() {
  const t = useTranslations("auth");
  // ?code= vem do link de recovery do e-mail (exige Suspense no pai).
  const code = useSearchParams().get("code");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(code ? { code, password } : { password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t("resetFailed"));
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("resetFailed"));
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <Input
          type="password"
          placeholder={t("newPasswordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button type="submit" className="w-full font-heading" disabled={busy || !password}>
          {busy ? t("resetBusy") : t("resetSubmit")}
        </Button>
      </form>
      <div className="mt-6 font-mono text-[11px]">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          {t("backToLogin")}
        </Link>
      </div>
    </>
  );
}

export default function RedefinirPage() {
  const t = useTranslations("auth");
  return (
    <AuthCard subtitle={t("resetTitle")}>
      <Suspense fallback={null}>
        <RedefinirForm />
      </Suspense>
    </AuthCard>
  );
}
