/** Locales do painel — cookie-based (URLs não mudam). Conteúdo do banco não é traduzido. */

export const LOCALES = ["pt", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt";

/** Cookie lido pelo next-intl no server e pelo lib/format no client. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Tag BCP-47 usada nas APIs Intl (datas, números, moeda). */
export const INTL_TAGS: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
