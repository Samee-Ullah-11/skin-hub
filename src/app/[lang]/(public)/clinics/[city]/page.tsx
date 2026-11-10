import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClinicCard } from "@/components/clinic/ClinicCard";
import { WaitlistForm } from "@/components/layout/PublicForms";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { fmt, isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";
import { pageMeta } from "@/lib/seo";
import { getTreatmentBySlug, listTreatments } from "@/services/catalog";
import { searchClinics } from "@/services/clinics";
import { getCityBySlug, listAreas } from "@/services/locations";
import { cardContext } from "@/services/public";

type SP = Record<string, string | string[] | undefined>;
const str = (v: SP[string]) => (typeof v === "string" ? v : undefined);
const num = (v: SP[string]) => {
  const n = Number(str(v));
  return str(v) && Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

export async function generateMetadata({ params }: PageProps<"/[lang]/clinics/[city]">): Promise<Metadata> {
  const { lang, city: slug } = await params;
  if (!isLang(lang)) return {};
  const city = await getCityBySlug(slug);
  if (!city) return {};
  const t = getDict(lang).search;
  const name = pick(city.name, lang);
  const meta = pageMeta(lang, `/clinics/${city.slug}`, fmt(t.title, { city: name }), fmt(t.metaDescription, { city: name }));
  return city.active ? meta : { ...meta, robots: { index: false } };
}

export default async function CityPage({ params, searchParams }: PageProps<"/[lang]/clinics/[city]">) {
  const { lang, city: slug } = await params;
  if (!isLang(lang)) notFound();
  const city = await getCityBySlug(slug);
  if (!city) notFound();
  const t = getDict(lang);
  const s = t.search;
  const cityName = pick(city.name, lang);
  const base = localePath(lang, `/clinics/${city.slug}`);

  if (!city.active) {
    return (
      <div className="container-page flex justify-center py-12">
        <Card className="flex w-full max-w-xl flex-col gap-4 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl">{fmt(s.inactiveTitle, { city: cityName })}</h1>
          <p className="text-muted">{fmt(s.inactiveBody, { city: cityName })}</p>
          <WaitlistForm lang={lang} t={s} city={city.slug} cityName={cityName} />
          {(await getSessionUser()) ? null : (
            <p className="border-t border-line pt-4 text-[15px]">
              {fmt(s.areYouClinic, { city: cityName })}{" "}
              <Link href={localePath(lang, "/signup?as=clinic")} className="link">
                {s.joinCta}
              </Link>
            </p>
          )}
        </Card>
      </div>
    );
  }

  const sp = await searchParams;
  const [areas, treatments] = await Promise.all([listAreas(city._id, { activeOnly: true }), listTreatments({ activeOnly: true })]);
  const treatmentSlug = str(sp.treatment);
  const areaSlug = str(sp.area);
  const treatment = treatmentSlug ? await getTreatmentBySlug(treatmentSlug) : null;
  const area = areas.find((a) => a.slug === areaSlug);
  const gender = str(sp.gender) === "female" || str(sp.gender) === "male" ? (str(sp.gender) as "female" | "male") : undefined;
  const openNow = str(sp.open) === "1";
  const minPrice = num(sp.min);
  const maxPrice = num(sp.max);
  const page = num(sp.page) ?? 1;

  const result = await searchClinics({
    cityId: city._id,
    areaId: area ? String(area._id) : undefined,
    treatmentId: treatment ? String(treatment._id) : undefined,
    gender,
    openNow,
    minPrice,
    maxPrice,
    page,
  });
  const ctx = await cardContext(result.items, await getSessionUser());
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && k !== "page") q.set(k, v);
    q.set("page", String(p));
    return `${base}?${q}`;
  };

  return (
    <div className="container-page flex flex-col gap-6 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl">{fmt(s.title, { city: cityName })}</h1>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <Card className="p-4">
            <form action={base} className="flex flex-col gap-4" aria-label={s.filters}>
              <h2 className="text-lg">{s.filters}</h2>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {s.treatment}
                <Select name="treatment" defaultValue={treatmentSlug ?? ""}>
                  <option value="">{t.home.anyTreatment}</option>
                  {treatments.map((tr) => (
                    <option key={tr.slug} value={tr.slug}>
                      {pick(tr.name, lang)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {s.area}
                <Select name="area" defaultValue={areaSlug ?? ""}>
                  <option value="">{t.home.anyArea}</option>
                  {areas.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {pick(a.name, lang)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                {s.doctorGender}
                <Select name="gender" defaultValue={gender ?? ""}>
                  <option value="">{s.anyGender}</option>
                  <option value="female">{s.femaleDoctor}</option>
                  <option value="male">{s.maleDoctor}</option>
                </Select>
              </label>
              <fieldset className="flex flex-col gap-1">
                <legend className="mb-1 text-sm font-semibold">{s.priceRange}</legend>
                <div className="grid grid-cols-2 gap-2">
                  <Input name="min" type="number" min={0} step={500} defaultValue={minPrice} placeholder={s.minPrice} aria-label={s.minPrice} dir="ltr" />
                  <Input name="max" type="number" min={0} step={500} defaultValue={maxPrice} placeholder={s.maxPrice} aria-label={s.maxPrice} dir="ltr" />
                </div>
              </fieldset>
              <label className="inline-flex items-center gap-2 text-[15px]">
                <input type="checkbox" name="open" value="1" defaultChecked={openNow} className="h-4 w-4 accent-[var(--primary)]" />
                {s.openNow}
              </label>
              <Button type="submit">{s.apply}</Button>
              <Link href={base} className="link text-center text-sm">
                {s.clear}
              </Link>
            </form>
          </Card>
        </aside>
        <section aria-live="polite">
          <p className="mb-3 text-muted">{fmt(s.results, { count: result.total })}</p>
          {result.items.length === 0 ? (
            <p>{s.noResults}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((c) => (
                <li key={String(c._id)}>
                  <ClinicCard lang={lang} t={t} clinic={c} ctx={ctx} />
                </li>
              ))}
            </ul>
          )}
          {result.pages > 1 ? (
            <nav className="mt-6 flex items-center gap-4" aria-label={fmt(t.common.page, { page: result.page, pages: result.pages })}>
              {result.page > 1 ? (
                <Link href={pageHref(result.page - 1)} className="link">
                  {t.common.previous}
                </Link>
              ) : null}
              <span className="text-sm text-muted">{fmt(t.common.page, { page: result.page, pages: result.pages })}</span>
              {result.page < result.pages ? (
                <Link href={pageHref(result.page + 1)} className="link">
                  {t.common.next}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
