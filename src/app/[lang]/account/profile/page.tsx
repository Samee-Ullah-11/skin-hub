import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Tile } from "@/components/ui/Tile";
import { isLang, localePath } from "@/i18n/config";
import { listPatientBookings } from "@/services/bookings";
import { listSavedClinics } from "@/services/engagement";
import { pointsBalance } from "@/services/points";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { AccountProfileForm, ChangePasswordForm } from "./ProfileForms";

export default async function AccountProfilePage({ params }: PageProps<"/[lang]/account/profile">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const user = await requireUser("patient");
  const href = (p: string) => localePath(lang, p);
  const [bookings, saved, points] = await Promise.all([
    listPatientBookings(user.id),
    listSavedClinics(user.id),
    pointsBalance(user.id),
  ]);
  const bookingsCount = bookings.filter((b) => b.status === "pending" || b.status === "confirmed").length;
  const savedCount = saved.length;
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t.auth.profileTitle} />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <li>
          <Tile href={href("/account/bookings")} icon="clock" title={t.nav.myBookings} value={bookingsCount} />
        </li>
        <li>
          <Tile href={href("/saved")} icon="heart" title={t.nav.saved} value={savedCount} />
        </li>
        <li>
          <Tile href={href("/account/points")} icon="star" title={t.nav.myPoints} value={points} />
        </li>
        <li>
          <form action="/api/auth/logout" method="post" className="h-full">
            <button
              type="submit"
              className="lift shadow-soft flex h-full w-full flex-col gap-3 rounded-2xl bg-surface p-4 text-start transition-colors hover:bg-[var(--status-rejected-bg)] hover:text-danger active:bg-[var(--status-rejected-bg)] active:text-danger"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)]">
                <Icon name="x" size={20} />
              </span>
              <span className="text-sm font-medium">{t.nav.logout}</span>
            </button>
          </form>
        </li>
      </ul>
      <Card className="max-w-xl p-5">
        <p className="mb-4 text-sm text-muted" dir="ltr">
          {user.email}
        </p>
        <AccountProfileForm lang={lang} t={t.auth} common={t.common} values={{ name: user.name, phone: user.phone, locale: user.locale }} />
      </Card>
      <Card className="max-w-xl p-5">
        <h2 className="mb-3 text-lg">{t.auth.changePassword}</h2>
        <ChangePasswordForm lang={lang} t={t.auth} />
      </Card>
    </div>
  );
}
