import { notFound, redirect } from "next/navigation";
import { site } from "@config/site";
import { isLang, localePath } from "@/i18n/config";

/** Turns the home page search form into a clean city URL with filters in the query string. */
export default async function SearchRedirect({ params, searchParams }: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const city = typeof sp.city === "string" && /^[a-z0-9-]{1,60}$/.test(sp.city) ? sp.city : site.defaultCitySlug;
  const qs = new URLSearchParams();
  for (const key of ["treatment", "area"]) {
    const v = sp[key];
    if (typeof v === "string" && /^[a-z0-9-]{1,60}$/.test(v)) qs.set(key, v);
  }
  const query = qs.toString();
  redirect(localePath(lang, `/clinics/${city}${query ? `?${query}` : ""}`));
}
