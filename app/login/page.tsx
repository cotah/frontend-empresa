"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
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
      if (!res.ok) throw new Error(json.error ?? "Falha no login");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="reveal corner-frame w-full max-w-sm rounded-md border border-border bg-card p-8">
        <div className="font-heading text-2xl font-bold tracking-wide">
          CAPIVA<span className="text-primary">REX</span>
        </div>
        <div className="label-mono mt-1 mb-8">command deck // acesso restrito</div>
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full font-heading" disabled={busy || !password}>
            {busy ? "Verificando…" : "Entrar no cockpit"}
          </Button>
        </form>
        <p className="mt-6 font-mono text-[10px] text-muted-foreground">
          sessão de dono único · cookie httponly · 30 dias
        </p>
      </div>
    </div>
  );
}
