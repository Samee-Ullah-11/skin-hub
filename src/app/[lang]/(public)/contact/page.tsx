import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPlaceholder, site } from "@config/site";
import { infoMeta } from "@/components/layout/InfoPage";
import { Logo } from "@/components/layout/Logo";
import { ContactForm } from "@/components/layout/PublicForms";
import { Icon } from "@/components/ui/Icon";
import { fmt, isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { pages } from "@/i18n/dict/pages";
import { waLink } from "@/lib/whatsapp";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? infoMeta(lang, "contact") : {};
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const page = pages[lang].contact;
  const showEmail = !isPlaceholder(site.supportEmail);
  const showWhatsApp = !isPlaceholder(site.supportWhatsApp);

  return (
    <div className="flex flex-col pb-16">
      {/* Light band in a pale shade of the logo colour, directly under the navbar. */}
      <section aria-labelledby="contact-title" className="relative -mt-20 overflow-hidden bg-chip pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="drift pointer-events-none absolute -top-24 start-1/4 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="drift-slow pointer-events-none absolute -bottom-24 end-10 h-72 w-72 rounded-full bg-white/60 blur-3xl" aria-hidden="true" />
        <div className="container-page relative flex flex-col items-center gap-10">
          <div className="rise-in flex flex-col items-center gap-5 text-center">
            <div className="shadow-soft flex h-24 min-w-24 items-center justify-center rounded-3xl bg-surface px-6 [&_span]:text-4xl">
              <Logo lang={lang} />
            </div>
            <h1 id="contact-title" className="text-4xl md:text-5xl">
              {t.home.contactTitle}
            </h1>
            <p className="max-w-xl text-lg text-muted">{t.home.contactBody}</p>
          </div>

          <div className="rise-in delay-2 grid w-full max-w-4xl gap-6 md:grid-cols-[1fr_1.4fr]">
            <ul className="flex flex-col gap-3">
              {page.blocks.flatMap((b) => b.p).map((p) => (
                <li key={p} className="shadow-soft flex gap-3 rounded-2xl bg-surface p-4 text-[15px]">
                  <Icon name="chat" size={20} className="mt-0.5 shrink-0 text-primary" />
                  <span>{fmt(p, { site: site.name })}</span>
                </li>
              ))}
              {showEmail ? (
                <li>
                  <a href={`mailto:${site.supportEmail}`} className="lift shadow-soft flex items-center gap-3 rounded-2xl bg-surface p-4 font-semibold" dir="ltr">
                    <Icon name="file" size={20} className="text-primary" />
                    {site.supportEmail}
                  </a>
                </li>
              ) : null}
              {showWhatsApp ? (
                <li>
                  <a href={waLink(site.supportWhatsApp)} target="_blank" rel="noopener noreferrer" className="lift shadow-soft flex items-center gap-3 rounded-2xl bg-surface p-4 font-semibold">
                    <Icon name="phone" size={20} className="text-primary" />
                    {t.footer.whatsappSupport}
                  </a>
                </li>
              ) : null}
            </ul>
            <div className="shadow-soft rounded-[2rem] bg-surface p-6 md:p-8">
              <ContactForm lang={lang} t={t.home} optional={t.common.optional} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
