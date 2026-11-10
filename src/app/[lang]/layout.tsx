import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { site } from "@config/site";
import { fontVariables } from "@/app/fonts";
import { ViewTransitionGuard } from "@/components/layout/ViewTransitionGuard";
import { dirOf, ENABLED_LANGS, isLang } from "@/i18n/config";
import "@/styles/globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1720" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: site.name, template: `%s | ${site.name}` },
};

export function generateStaticParams() {
  return ENABLED_LANGS.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const theme = (await cookies()).get("theme")?.value;
  const pinned = theme === "light" || theme === "dark" ? theme : undefined;

  return (
    <html lang={lang} dir={dirOf(lang)} data-theme={pinned} className={fontVariables} suppressHydrationWarning>
      <body>
        <ViewTransitionGuard />
        <ViewTransition default="page">
          <div className="flex min-h-dvh flex-col">{children}</div>
        </ViewTransition>
      </body>
    </html>
  );
}
