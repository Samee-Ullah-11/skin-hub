import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { LocalizedRowForm } from "@/components/admin/LocalizedRowForm";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Form";
import { isLang, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { listAreas, listCities, listLocationRequests, listProvinces } from "@/services/locations";

export default async function LocationsPage({ params, searchParams }: PageProps<"/[lang]/admin/locations">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  await requireUser("admin");
  const t = getDict(lang);
  const a = t.admin;
  const sp = await searchParams;
  const [provinces, cities, requests] = await Promise.all([listProvinces(), listCities(), listLocationRequests()]);
  const selectedCity = cities.find((c) => c.slug === sp.city) ?? cities.find((c) => c.active) ?? cities[0];
  const areas = selectedCity ? await listAreas(selectedCity._id) : [];
  const labels = { en: a.nameEn, ur: a.nameUr, active: a.active, save: t.common.save };
  const provinceName = (id: unknown) => pick(provinces.find((p) => String(p._id) === String(id))?.name, lang);
  const cityName = (id: unknown) => pick(cities.find((c) => String(c._id) === String(id))?.name, lang);

  const coords = (lat?: number, lng?: number) => (
    <>
      <label className="flex flex-col gap-1 text-sm">
        {a.centerLat}
        <Input name="lat" defaultValue={lat} required className="h-9 w-28" dir="ltr" inputMode="decimal" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {a.centerLng}
        <Input name="lng" defaultValue={lng} required className="h-9 w-28" dir="ltr" inputMode="decimal" />
      </label>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={a.navLocations} />

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{a.locationRequests}</h2>
        {requests.length === 0 ? <p className="text-muted">{a.noRequests}</p> : null}
        <ul className="flex flex-col divide-y divide-line">
          {requests.map((r) => (
            <li key={String(r._id)} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <strong dir="auto">{r.name}</strong> · {r.kind === "city" ? t.dashboard.requestCity : t.dashboard.requestArea} ·{" "}
                {r.cityId ? cityName(r.cityId) : provinceName(r.provinceId)}
              </span>
              <span className="flex gap-2">
                <AdminForm op="locreq.resolve" lang={lang} hidden={{ id: String(r._id), approve: "1" }}>
                  <SubmitButton>{a.approveRequest}</SubmitButton>
                </AdminForm>
                <AdminForm op="locreq.resolve" lang={lang} hidden={{ id: String(r._id), approve: "0" }}>
                  <SubmitButton variant="secondary">{a.rejectRequest}</SubmitButton>
                </AdminForm>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{a.provinces}</h2>
        {provinces.map((p) => (
          <LocalizedRowForm key={String(p._id)} op="province.save" lang={lang} labels={labels} values={{ id: String(p._id), en: p.name.en, ur: p.name.ur ?? "", active: p.active }} />
        ))}
        <h3 className="mt-2 text-base font-semibold">{a.addProvince}</h3>
        <LocalizedRowForm op="province.save" lang={lang} labels={labels} />
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{a.cities}</h2>
        {cities.map((c) => (
          <div key={String(c._id)} className="flex flex-col gap-1 border-b border-line pb-3">
            <p className="text-sm text-muted">{provinceName(c.provinceId)}</p>
            <LocalizedRowForm
              op="city.save"
              lang={lang}
              labels={labels}
              values={{ id: String(c._id), en: c.name.en, ur: c.name.ur ?? "", active: c.active }}
              hidden={{ provinceId: String(c.provinceId) }}
              extra={coords(c.center.lat, c.center.lng)}
            />
          </div>
        ))}
        <h3 className="mt-2 text-base font-semibold">{a.addCity}</h3>
        <LocalizedRowForm
          op="city.save"
          lang={lang}
          labels={labels}
          extra={
            <>
              <label className="flex flex-col gap-1 text-sm">
                {t.dashboard.province}
                <Select name="provinceId" className="h-9 w-48">
                  {provinces.map((p) => (
                    <option key={String(p._id)} value={String(p._id)}>
                      {pick(p.name, lang)}
                    </option>
                  ))}
                </Select>
              </label>
              {coords()}
            </>
          }
        />
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{a.areas}</h2>
        <form className="flex items-end gap-2">
          <Select name="city" defaultValue={selectedCity?.slug} className="h-9 w-56" aria-label={a.city}>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {pick(c.name, lang)}
              </option>
            ))}
          </Select>
          <button type="submit" className="h-9 rounded-md border border-line px-3 text-sm">
            {t.common.search}
          </button>
        </form>
        {areas.map((ar) => (
          <LocalizedRowForm
            key={String(ar._id)}
            op="area.save"
            lang={lang}
            labels={labels}
            values={{ id: String(ar._id), en: ar.name.en, ur: ar.name.ur ?? "", active: ar.active }}
            hidden={{ cityId: String(ar.cityId) }}
          />
        ))}
        {selectedCity ? (
          <>
            <h3 className="mt-2 text-base font-semibold">{a.addArea}</h3>
            <LocalizedRowForm op="area.save" lang={lang} labels={labels} hidden={{ cityId: String(selectedCity._id) }} />
          </>
        ) : null}
      </Card>
    </div>
  );
}
