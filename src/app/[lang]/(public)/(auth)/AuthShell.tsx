import Link from "next/link";
import type { ReactNode } from "react";
import type { Dict } from "@/i18n";
import { localePath, type Lang } from "@/i18n/config";
import { Icon } from "@/components/ui/Icon";

export type AuthSide = "patient" | "clinic";

/** Simple centred card, used by the verify and password pages. */
export function AuthShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="container-page flex min-h-[calc(100svh-5rem)] items-center justify-center py-10">
      <div className="shadow-soft w-full max-w-md rounded-3xl bg-surface p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        {intro ? <p className="mt-2 text-muted">{intro}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * Login and signup layout. Patients and clinics each get their own colour (via data-role),
 * a side panel describing what they get, and a switch to the other side.
 */
export function RoleAuthShell({
  lang,
  t,
  side,
  mode,
  title,
  intro,
  children,
}: {
  lang: Lang;
  t: Dict["auth"];
  side: AuthSide;
  mode: "login" | "signup";
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const base = mode === "login" ? "/login" : "/signup";
  const tabs: { side: AuthSide; label: string; href: string }[] = [
    { side: "patient", label: t.patientSide, href: localePath(lang, base) },
    { side: "clinic", label: t.clinicSide, href: localePath(lang, `${base}?as=clinic`) },
  ];
  return (
    <div data-role={side === "clinic" ? "clinic" : "public"} className="container-page flex min-h-[calc(100svh-5rem)] items-center py-8">
      <div className="shadow-soft grid w-full overflow-hidden rounded-[2rem] bg-surface md:grid-cols-[2fr_3fr]">
        <aside className="flex flex-col justify-between gap-8 bg-primary p-8 text-on-primary md:p-10">
          <div className="flex flex-col gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Icon name={side === "clinic" ? "pin" : "user"} size={28} />
            </span>
            <p className="text-2xl font-semibold">{side === "clinic" ? t.clinicSide : t.patientSide}</p>
            <p className="opacity-90">{side === "clinic" ? t.clinicAside : t.patientAside}</p>
          </div>
          <nav aria-label={t.iAmA} className="grid grid-cols-2 gap-1 rounded-full bg-black/15 p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.side}
                href={tab.href}
                aria-current={tab.side === side ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors ${
                  tab.side === side ? "bg-surface text-primary" : "text-on-primary hover:bg-white/10"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="p-6 md:p-10">
          <h1 className="text-2xl md:text-3xl">{title}</h1>
          <p className="mt-2 text-muted">{intro}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
