"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/shell/locale-switcher";
import { useApi } from "@/lib/hooks";
import { activeIntlTag, fmtMoney } from "@/lib/format";
import type { ApprovalsCount, CfoSummary } from "@/lib/types";

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    // Primeiro tick assíncrono — sem setState síncrono no corpo do efeito.
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
      {now ? now.toLocaleTimeString(activeIntlTag()) : "--:--:--"}
    </span>
  );
}

export function Topbar() {
  const t = useTranslations("shell");
  // Caixa real sempre visível (poll 60s) + badge de pendências (45s)
  const { data: cfo } = useApi<CfoSummary>("/api/cfo/reports", 60_000);
  const { data: counts } = useApi<ApprovalsCount>("/api/approvals/count", 45_000);
  const { data: me } = useApi<{ email: string; workspace: string }>("/api/auth/me");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-background/85 backdrop-blur-md px-4 lg:px-6 h-14">
      {/* Caixa real */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="label-mono hidden sm:inline">{t("cash")}</span>
        <span className="font-heading text-base font-semibold text-success tabular-nums truncate">
          {cfo ? fmtMoney(cfo.total_gross, "EUR") : "—"}
        </span>
        {cfo && (
          <span className="hidden lg:inline font-mono text-[11px] text-muted-foreground">
            {t("company")} {fmtMoney(cfo.total_company_share, "EUR")}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Pendências */}
      {(counts?.total ?? 0) > 0 && (
        <Link
          href="/aprovacoes"
          className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
        >
          <span className="dot-pulse bg-primary" />
          <span className="font-mono font-semibold">{counts!.total}</span>
          <span className="hidden sm:inline">{t("pending", { count: counts!.total })}</span>
        </Link>
      )}

      <Clock />
      <LocaleSwitcher />

      {/* Workspace + e-mail do usuário logado */}
      {me && (
        <div className="hidden md:flex flex-col items-end leading-tight">
          <span className="font-mono text-[11px] text-foreground">{me.workspace}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{me.email}</span>
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={logout} title={t("logout")}>
        <LogOut className="size-4" />
      </Button>
    </header>
  );
}
