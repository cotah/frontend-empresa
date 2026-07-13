"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t("loginFailed"));
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginFailed"));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="reveal corner-frame w-full max-w-sm rounded-md border border-border bg-card p-8">
        <div className="font-heading text-2xl font-bold tracking-wide">
          CAPIVA<span className="text-primary">REX</span>
        </div>
        <div className="label-mono mt-1 mb-8">{t("restricted")}</div>
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full font-heading" disabled={busy || !password}>
            {busy ? t("checking") : t("submit")}
          </Button>
        </form>
        <p className="mt-6 font-mono text-[10px] text-muted-foreground">
          {t("footer")}
        </p>
      </div>
    </div>
  );
}
