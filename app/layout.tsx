import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Oxanium } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { INTL_TAGS, type Locale } from "@/i18n/config";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CAPIVAREX — Command Deck",
  description: "Cockpit da empresa AI: CEO, aprovações, caixa, produção e agentes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Locale vem do cookie (i18n/request.ts); default pt. URLs não mudam.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={INTL_TAGS[locale as Locale] ?? "pt-BR"}
      className={`dark ${plexSans.variable} ${plexMono.variable} ${oxanium.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
