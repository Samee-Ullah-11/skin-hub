import Link from "next/link";
import { FeaturedBadge, StatusChip, clinicTone, Chip } from "@/components/ui/Chip";
import { fmt, localePath, pick, type Lang } from "@/i18n/config";
import type { Dict } from "@/i18n";
import { formatDate } from "@/lib/format";
import type { ClinicDoc } from "@/models/Clinic";
import { isFeatured } from "@/services/clinics";

type Row = ClinicDoc & { ownerId: unknown };

export function ClinicTable({ lang, t, clinics }: { lang: Lang; t: Dict; clinics: Row[] }) {
  if (!clinics.length) return <p className="text-muted">{t.common.noResults}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[640px] text-start text-[15px]">
        <thead className="bg-soft text-sm text-muted">
          <tr>
            <th className="px-3 py-2 text-start font-semibold">{t.common.name}</th>
            <th className="px-3 py-2 text-start font-semibold">{t.admin.owner}</th>
            <th className="px-3 py-2 text-start font-semibold">{t.common.status}</th>
            <th className="px-3 py-2 text-start font-semibold">{t.common.date}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {clinics.map((c) => {
            const owner = c.ownerId as { name?: string; email?: string } | null;
            return (
              <tr key={String(c._id)}>
                <td className="px-3 py-3">
                  <Link href={localePath(lang, `/admin/clinics/${c._id}`)} className="font-medium text-primary hover:underline">
                    {pick(c.name, lang)}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {isFeatured(c) ? <FeaturedBadge label={t.common.featured} /> : null}
                    {c.isSample ? <Chip>{t.common.sample}</Chip> : null}
                    {c.deletedAt ? <Chip>{t.admin.deleted}</Chip> : null}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div>{owner?.name}</div>
                  <div className="text-sm text-muted" dir="ltr">
                    {owner?.email}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <StatusChip tone={clinicTone(c.status)} label={t.status[c.status]} />
                </td>
                <td className="px-3 py-3 text-sm text-muted">
                  {c.submittedAt ? fmt(t.admin.submittedOn, { date: formatDate(c.submittedAt, lang) }) : formatDate(c.createdAt, lang)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
