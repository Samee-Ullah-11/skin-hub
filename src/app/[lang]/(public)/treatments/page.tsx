import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { site } from "@config/site";
import { Icon } from "@/components/ui/Icon";
import { fmt, isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { pageMeta } from "@/lib/seo";
import { treatmentImage } from "@/lib/treatment-image";
import { listCategories, listTreatments } from "@/services/catalog";
import { getCityBySlug } from "@/services/locations";

export async function generateMetadata({ params }: PageProps<"/[lang]/treatments">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return pageMeta(lang, "/treatments", t.search.treatmentsTitle, t.home.metaDescription);
}

export default async function TreatmentsPage({ params }: PageProps<"/[lang]/treatments">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const slug = (await cookies()).get("city")?.value ?? site.defaultCitySlug;
  const city = (await getCityBySlug(slug)) ?? (await getCityBySlug(site.defaultCitySlug));
  const [categories, treatments] = await Promise.all([listCategories({ activeOnly: true }), listTreatments({ activeOnly: true })]);
  const citySlug = city?.slug ?? site.defaultCitySlug;

  return (
    <div className="container-page flex flex-col gap-8 py-8 md:py-12">
      <header>
        <h1 className="text-3xl md:text-4xl">{t.search.treatmentsTitle}</h1>
        <p className="mt-2 text-muted">{fmt(t.search.treatmentsIntro, { city: pick(city?.name, lang) })}</p>
      </header>
      {categories.map((cat) => (
        <section key={String(cat._id)} aria-labelledby={`cat-${cat.slug}`}>
          <h2 id={`cat-${cat.slug}`} className="mb-3 text-2xl">
            {pick(cat.name, lang)}
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {treatments
              .filter((tr) => String(tr.categoryId) === String(cat._id))
              .map((tr) => {
                const img = treatmentImage(tr);
                return (
                  <li key={tr.slug}>
                    <Link
                      href={localePath(lang, `/clinics/${citySlug}?treatment=${tr.slug}`)}
                      className="lift shadow-soft group flex h-full flex-col overflow-hidden rounded-3xl bg-surface"
                    >
                      <span className="relative block aspect-[4/3] overflow-hidden bg-soft">
                        <Image src={img.src} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-300 ease-out group-hover:scale-105" />
                        {img.sample ? (
                          <span className="absolute start-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-semibold">{t.common.sample}</span>
                        ) : null}
                      </span>
                      <span className="flex items-center justify-between gap-2 p-4 font-semibold group-hover:text-primary">
                        {pick(tr.name, lang)}
                        <Icon name="chevronRight" size={16} className="shrink-0 rtl:rotate-180" />
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
