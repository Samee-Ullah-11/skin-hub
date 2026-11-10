import Image from "next/image";
import { notFound } from "next/navigation";
import { removePhotoAction } from "@/actions/clinic";
import { Uploader } from "@/components/clinic/Uploader";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isLang, pick } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { imageUrl } from "@/lib/cloudinary";
import { cloudinaryConfigured } from "@/lib/env";
import { listCategories, listTreatments } from "@/services/catalog";
import { requireOwnClinic } from "@/services/clinics";
import { listAllActiveAreas, listCities, listProvinces } from "@/services/locations";
import { LocationRequestForm } from "./LocationRequestForm";
import { ProfileForm } from "./ProfileForm";

export default async function ClinicProfilePage({ params }: PageProps<"/[lang]/dashboard/profile">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const user = await requireUser("clinic_owner");
  const clinic = await requireOwnClinic(user.id);
  const [categories, provinces, cities, areas, treatments] = await Promise.all([
    listCategories({ activeOnly: true }),
    listProvinces(),
    listCities(),
    listAllActiveAreas(),
    listTreatments({ activeOnly: true }),
  ]);
  const uploads = cloudinaryConfigured();
  const uploaderLabels = {
    button: t.dashboard.addPhoto,
    uploading: t.dashboard.uploading,
    failed: t.dashboard.uploadFailed,
    tooBig: t.dashboard.fileTooBig,
    notConfigured: t.dashboard.uploadsNotConfigured,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t.dashboard.navProfile} intro={t.dashboard.profileIntro} />
      <ProfileForm
        lang={lang}
        t={{ d: t.dashboard, c: t.common, auth: t.auth }}
        data={{
          name: { en: clinic.name.en, ur: clinic.name.ur ?? "" },
          address: { en: clinic.address?.en ?? "", ur: clinic.address?.ur ?? "" },
          description: { en: clinic.description?.en ?? "", ur: clinic.description?.ur ?? "" },
          categoryId: clinic.categoryId ? String(clinic.categoryId) : "",
          provinceId: clinic.provinceId ? String(clinic.provinceId) : "",
          cityId: clinic.cityId ? String(clinic.cityId) : "",
          areaId: clinic.areaId ? String(clinic.areaId) : "",
          phone: clinic.phone,
          whatsapp: clinic.whatsapp,
          location: clinic.location?.coordinates?.length === 2
            ? { lat: clinic.location.coordinates[1], lng: clinic.location.coordinates[0] }
            : undefined,
          treatments: Object.fromEntries(clinic.treatments.map((tr) => [String(tr.treatmentId), tr.fromPricePkr ?? null])),
        }}
        categories={categories.map((x) => ({ id: String(x._id), name: pick(x.name, lang) }))}
        provinces={provinces.map((x) => ({ id: String(x._id), name: pick(x.name, lang) }))}
        cities={cities.map((x) => ({ id: String(x._id), name: pick(x.name, lang), provinceId: String(x.provinceId), center: x.center }))}
        areas={areas.map((x) => ({ id: String(x._id), name: pick(x.name, lang), cityId: String(x.cityId) }))}
        treatments={treatments.map((x) => ({ id: String(x._id), name: pick(x.name, lang), categoryId: String(x.categoryId) }))}
      />

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-lg">{t.dashboard.photos}</h2>
        <p className="text-sm text-muted">{t.dashboard.photosHint}</p>
        {clinic.photos.length ? (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {clinic.photos.map((p) => (
              <li key={p.publicId} className="flex flex-col gap-2">
                {uploads ? (
                  <Image
                    src={imageUrl(p.publicId, { width: 400, height: 300 })}
                    alt={p.alt}
                    width={400}
                    height={300}
                    unoptimized
                    className="aspect-[4/3] w-full rounded-md object-cover"
                  />
                ) : null}
                <form action={removePhotoAction}>
                  <input type="hidden" name="lang" value={lang} />
                  <input type="hidden" name="publicId" value={p.publicId} />
                  <Button type="submit" variant="danger" size="sm">
                    {t.dashboard.removePhoto}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
        {uploads ? (
          clinic.photos.length < 8 ? (
            <Uploader kind="photo" accept="image/jpeg,image/png,image/webp" labels={uploaderLabels} alt={clinic.name.en} />
          ) : null
        ) : (
          <p className="text-sm text-muted">{t.dashboard.uploadsNotConfigured}</p>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-lg">{t.dashboard.missingLocation}</h2>
        <LocationRequestForm
          lang={lang}
          t={t.dashboard}
          provinces={provinces.map((x) => ({ id: String(x._id), name: pick(x.name, lang) }))}
          cities={cities.map((x) => ({ id: String(x._id), name: pick(x.name, lang), provinceId: String(x.provinceId) }))}
        />
      </Card>
    </div>
  );
}
