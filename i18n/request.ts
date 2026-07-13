import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";

/** Config do next-intl por request: locale vem do cookie (default pt). */
export default getRequestConfig(async () => {
  const store = await cookies();
  const candidate = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(candidate) ? candidate : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
