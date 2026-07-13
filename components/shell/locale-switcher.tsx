"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Grava o cookie de locale (1 ano). Fora do componente — mutação de API do browser. */
function persistLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
}

/** Seletor PT · EN · ES — grava o cookie e re-renderiza com o novo locale. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function change(next: Locale) {
    if (next === locale) return;
    persistLocale(next);
    router.refresh();
  }

  return (
    <div className="flex items-center rounded-sm border border-border overflow-hidden">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => change(l)}
          className={cn(
            "px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
            l === locale
              ? "bg-primary/12 text-primary"
              : "text-muted-foreground hover:bg-muted/40",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
