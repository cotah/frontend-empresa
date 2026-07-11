"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Factory,
  Gauge,
  Images,
  LayoutDashboard,
  Lightbulb,
  MessagesSquare,
  Stamp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/hooks";
import type { ApprovalsCount } from "@/lib/types";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/reuniao", label: "Reunião (CEO)", icon: MessagesSquare },
  { href: "/aprovacoes", label: "Aprovações", icon: Stamp },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/ideias", label: "Estoque de Ideias", icon: Lightbulb },
  { href: "/producao", label: "Linha de Produção", icon: Factory },
  { href: "/revisao", label: "Revisão de Criação", icon: Images },
  { href: "/agentes", label: "Agentes", icon: Bot },
  { href: "/atividade", label: "Atividade", icon: Activity },
  { href: "/apis", label: "APIs / Saldos", icon: Gauge },
];

export function Sidebar() {
  const pathname = usePathname();
  // Badge de pendências — polling leve (45s)
  const { data: counts } = useApi<ApprovalsCount>("/api/approvals/count", 45_000);

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-sm">
      {/* Marca */}
      <div className="px-5 pt-6 pb-5 border-b border-sidebar-border">
        <div className="font-heading text-lg font-bold tracking-wide text-foreground">
          CAPIVA<span className="text-primary">REX</span>
        </div>
        <div className="label-mono mt-1">command deck</div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const isApprovals = href === "/aprovacoes";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-primary border-l-2 border-primary -ml-px"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span className="flex-1 truncate">{label}</span>
              {isApprovals && (counts?.total ?? 0) > 0 && (
                <span className="font-mono text-[10px] font-semibold rounded-sm bg-primary/15 text-primary px-1.5 py-0.5">
                  {counts!.total}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border">
        <div className="label-mono flex items-center gap-2">
          <span className="dot-pulse bg-success" />
          sistemas operacionais
        </div>
      </div>
    </aside>
  );
}
