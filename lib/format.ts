/** Formatação de dinheiro, datas e tempo relativo no locale ativo (cookie NEXT_LOCALE). */

import { DEFAULT_LOCALE, INTL_TAGS, LOCALE_COOKIE, isLocale } from "@/i18n/config";

/**
 * Tag Intl do locale ativo. No client lê o cookie; no server/prerender cai no
 * default (pt-BR) — os dados do painel chegam via fetch no client, então as
 * datas/valores reais sempre renderizam já com o locale certo.
 */
export function activeIntlTag(): string {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(\\w+)`));
    if (match && isLocale(match[1])) return INTL_TAGS[match[1]];
  }
  return INTL_TAGS[DEFAULT_LOCALE];
}

export function fmtMoney(value: number | null | undefined, currency = "EUR"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat(activeIntlTag(), { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(activeIntlTag(), {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const rtf = new Intl.RelativeTimeFormat(activeIntlTag(), { numeric: "auto" });
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return rtf.format(0, "second"); // "agora" / "now" / "ahora"
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}
