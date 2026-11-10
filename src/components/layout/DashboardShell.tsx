import type { ReactNode } from "react";
import type { Lang } from "@/i18n/config";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SideNav } from "./SideNav";
import { Breadcrumbs } from "./Breadcrumbs";
import { getDict } from "@/i18n";
import type { IconName } from "@/components/ui/Icon";

export function DashboardShell({
  lang,
  role,
  title,
  links,
  children,
}: {
  lang: Lang;
  role: "public" | "clinic" | "admin";
  title: string;
  /** Side menu links; leave empty for no menu. */
  links: { href: string; label: string; exact?: boolean; icon?: IconName }[];
  children: ReactNode;
}) {
  const hasNav = links.length > 0;
  const nav = getDict(lang).nav;
  const homeLabel = nav.dashboard;
  const breadcrumbLabel = nav.youAreHere;
  return (
    <div data-role={role} className="flex flex-1 flex-col">
      <Header lang={lang} menuLinks={links} menuTitle={title} />
      <div className={`container-page grid flex-1 gap-6 pt-26 pb-6 lg:pt-30 lg:pb-10 ${hasNav ? "lg:grid-cols-[240px_1fr]" : ""}`}>
        {hasNav ? (
          <aside className="shadow-soft hidden h-fit min-w-0 flex-col gap-3 rounded-3xl bg-surface p-3 lg:sticky lg:top-24 lg:flex">
            <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
            <SideNav links={links} label={title} />
          </aside>
        ) : null}
        <main id="main" className="min-w-0">
          {hasNav ? <Breadcrumbs homeHref={links[0].href} homeLabel={homeLabel} links={links} ariaLabel={breadcrumbLabel} /> : null}
          {children}
        </main>
      </div>
      <Footer lang={lang} />
    </div>
  );
}

export function PageTitle({ title, intro, actions }: { title: string; intro?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        {intro ? <p className="mt-1 max-w-2xl text-muted">{intro}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
