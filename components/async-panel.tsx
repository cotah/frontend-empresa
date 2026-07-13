"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Estados padrão de carregamento/erro/vazio pra qualquer bloco de dados. */
export function AsyncPanel({
  loading,
  error,
  empty,
  emptyMessage,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("common");
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-10 w-3/5" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
        <TriangleAlert className="size-4 shrink-0" />
        <span className="flex-1">{error}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5 mr-1" /> {t("retry")}
          </Button>
        )}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? t("empty")}
      </div>
    );
  }
  return <>{children}</>;
}
