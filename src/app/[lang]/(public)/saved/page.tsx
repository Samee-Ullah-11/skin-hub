import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ClinicCard } from "@/components/clinic/ClinicCard";
import { LinkButton } from "@/components/ui/Button";
import { isLang, localePath } from "@/i18n/config";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";
import { GUEST_LIKES_COOKIE, parseGuestLikes } from "@/lib/guest-likes";
import { listClinicsByIds, listSavedClinics } from "@/services/engagement";
import { cardContext } from "@/services/public";

export async function generateMetadata({ params }: PageProps<"/[lang]/saved">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLang(lang) ? getDict(lang).account.savedTitle : undefined, robots: { index: false } };
}

/** Saved clinics for everyone: patients from their account, visitors from this browser. */
export default async function SavedPage({ params }: PageProps<"/[lang]/saved">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const user = await getSessionUser();
  const clinics =
    user?.role === "patient"
      ? await listSavedClinics(user.id)
      : user
        ? []
        : await listClinicsByIds(parseGuestLikes((await cookies()).get(GUEST_LIKES_COOKIE)?.value));
  const ctx = await cardContext(clinics, user);

  return (
    <div className="container-page flex flex-col gap-6 py-10 md:py-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl">{t.account.savedTitle}</h1>
        <p className="text-muted">{t.account.savedIntro}</p>
      </div>
      {!user && clinics.length ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-chip p-4 text-chip-ink sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">{t.account.savedGuestNote}</p>
          <LinkButton href={localePath(lang, "/login?next=/saved")} size="sm" className="rounded-full">
            {t.nav.login}
          </LinkButton>
        </div>
      ) : null}
      {clinics.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clinics.map((c) => (
            <li key={String(c._id)}>
              <ClinicCard lang={lang} t={t} clinic={c} ctx={ctx} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl bg-soft p-8 text-muted">{t.account.savedEmpty}</p>
      )}
    </div>
  );
}
