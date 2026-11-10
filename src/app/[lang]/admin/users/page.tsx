import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Form";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { ROLES, type Role } from "@/models/User";
import { listUsers } from "@/services/admin";

export default async function UsersPage({ params, searchParams }: PageProps<"/[lang]/admin/users">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const me = await requireUser("admin");
  const t = getDict(lang);
  const sp = await searchParams;
  const role = ROLES.includes(sp.role as Role) ? (sp.role as Role) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  const users = await listUsers({ role, q });
  return (
    <div>
      <PageTitle title={t.admin.users} />
      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <Select name="role" defaultValue={role ?? ""} className="w-44" aria-label={t.admin.role}>
          <option value="">{t.common.all}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Input name="q" defaultValue={q} className="w-56" aria-label={t.common.search} />
        <Button type="submit" variant="secondary">
          {t.common.search}
        </Button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[720px] text-[15px]">
          <thead className="bg-soft text-sm text-muted">
            <tr>
              <th className="px-3 py-2 text-start">{t.common.name}</th>
              <th className="px-3 py-2 text-start">{t.admin.role}</th>
              <th className="px-3 py-2 text-start">{t.admin.joined}</th>
              <th className="px-3 py-2 text-start">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={String(u._id)}>
                <td className="px-3 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-muted" dir="ltr">
                    {u.email} · {u.phone}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Chip>{u.role}</Chip>
                    {u.emailVerifiedAt ? <Chip>{t.admin.verified}</Chip> : null}
                    {u.disabledAt ? <Chip>{t.admin.disabled}</Chip> : null}
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-muted">{formatDate(u.createdAt, lang)}</td>
                <td className="px-3 py-3">
                  {String(u._id) !== me.id ? (
                    <div className="flex flex-wrap gap-2">
                      <AdminForm op="user.revoke" lang={lang} hidden={{ userId: String(u._id) }}>
                        <SubmitButton variant="secondary">{t.admin.revokeSessions}</SubmitButton>
                      </AdminForm>
                      {u.role !== "admin" ? (
                        <AdminForm op={u.disabledAt ? "user.enable" : "user.disable"} lang={lang} hidden={{ userId: String(u._id) }}>
                          <SubmitButton variant={u.disabledAt ? "secondary" : "danger"}>{u.disabledAt ? t.admin.enable : t.admin.disable}</SubmitButton>
                        </AdminForm>
                      ) : null}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
