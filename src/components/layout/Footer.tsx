import Image from "next/image";
import Link from "next/link";
import { isPlaceholder, site } from "@config/site";
import { fmt, localePath, type Lang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { waLink } from "@/lib/whatsapp";
import { getSessionUser } from "@/lib/auth/session";
import { BrandLogo, type Brand } from "@/components/ui/BrandLogo";

const SOCIAL: Record<keyof typeof site.social, Brand> = { Instagram: "instagram", TikTok: "tiktok", X: "x" };

/** The site logo at display size for the footer's logo section. */
function BigLogo({ lang }: { lang: Lang }) {
  return (
    <Link href={localePath(lang, "/")} aria-label={site.name} className="inline-flex">
      {isPlaceholder(site.logo.src) ? (
        <span className="text-7xl font-bold tracking-tight text-primary md:text-8xl" lang="en" dir="ltr">
          {site.name}
        </span>
      ) : (
        <Image src={site.logo.src} alt={site.name} width={site.logo.width * 3} height={site.logo.height * 3} className="h-20 w-auto md:h-28" />
      )}
    </Link>
  );
}

export async function Footer({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const user = await getSessionUser();
  const href = (p: string) => localePath(lang, p);
  // Sign-up, register and log-in links only make sense for visitors who are not logged in.
  const columns = [
    {
      title: t.footer.forPatients,
      links: [
        { href: href(`/clinics/${site.defaultCitySlug}`), label: t.footer.findClinic },
        { href: href("/treatments"), label: t.nav.services },
        { href: href("/deals"), label: t.nav.deals },
        ...(user ? [] : [{ href: href("/signup"), label: t.nav.signUp }]),
      ],
    },
    {
      title: t.footer.forClinics,
      links: user
        ? user.role === "clinic_owner"
          ? [{ href: href("/dashboard"), label: t.nav.dashboard }]
          : []
        : [
            { href: href("/signup?as=clinic"), label: t.footer.joinAsClinic },
            { href: href("/login?as=clinic"), label: t.footer.clinicLogin },
          ],
    },
    {
      title: t.footer.company,
      links: [
        { href: href("/about"), label: t.footer.about },
        { href: href("/contact"), label: t.footer.contact },
        { href: href("/privacy"), label: t.footer.privacy },
        { href: href("/terms"), label: t.footer.terms },
        { href: href("/medical-disclaimer"), label: t.footer.disclaimer },
      ],
    },
  ];

  const channels = [
    { name: t.common.email, value: site.supportEmail, href: `mailto:${site.supportEmail}`, brand: "gmail" as Brand },
    { name: t.footer.whatsappSupport, value: site.supportWhatsApp, href: waLink(site.supportWhatsApp), brand: "whatsapp" as Brand },
    ...Object.entries(site.social).map(([name, url]) => ({ name, value: url, href: url, brand: SOCIAL[name as keyof typeof SOCIAL] })),
  ];
  const chip = "flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-soft";

  return (
    <footer className="bg-soft pb-24 lg:pb-0">
      <div className="container-page">
        <div className="grid gap-10 py-12 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4 sm:col-span-3 lg:col-span-1">
            <BigLogo lang={lang} />
            <p className="max-w-sm text-sm text-muted">{fmt(t.common.medicalDisclaimer, { site: site.name })}</p>
            <ul className="mt-2 flex flex-wrap gap-3">
              {channels.map((c) => (
                <li key={c.name}>
                  {isPlaceholder(c.value) ? (
                    <span title={c.name} className={chip}>
                      <BrandLogo brand={c.brand} />
                    </span>
                  ) : (
                    <a
                      href={c.href}
                      aria-label={c.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${chip} transition-transform duration-150 ease-out hover:scale-110 active:scale-95`}
                    >
                      <BrandLogo brand={c.brand} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {columns.filter((col) => col.links.length).map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{col.title}</h2>
              <ul className="flex flex-col gap-1.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15px] hover:text-primary hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="border-t border-line py-6 text-sm text-muted">{fmt(t.footer.rights, { year: new Date().getFullYear(), site: site.name })}</p>
      </div>
    </footer>
  );
}
