import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Chip, FeaturedBadge } from "@/components/ui/Chip";
import { isLang, localePath, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { listClinicsForAdmin } from "@/services/clinics";

export default async function FeaturedPage({ params }: PageProps<"/[lang]/admin/featured">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const a = t.admin;
  const now = new Date();
  const clinics = (await listClinicsForAdmin()).filter((c) => c.featuredFrom && c.featuredUntil);
  return (
    <div>
      <PageTitle title={a.navFeatured} />
      {clinics.length === 0 ? <p className="text-muted">{a.noFeatured}</p> : null}
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {clinics.map((c) => {
          const state = c.featuredFrom! > now ? a.featuredScheduled : c.featuredUntil! < now ? a.featuredEnded : null;
          return (
            <li key={String(c._id)} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={localePath(lang, `/admin/clinics/${c._id}`)} className="font-medium text-primary hover:underline">
                  {pick(c.name, lang)}
                </Link>
                <p className="text-sm text-muted">
                  {formatDate(c.featuredFrom!, lang)} – {formatDate(c.featuredUntil!, lang)}
                  {c.featuredNote ? ` · ${a.paymentRef}: ${c.featuredNote}` : ""}
                </p>
              </div>
              {state ? <Chip>{state}</Chip> : <FeaturedBadge label={a.featuredNow} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
