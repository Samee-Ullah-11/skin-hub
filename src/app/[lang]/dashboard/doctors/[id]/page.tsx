import Image from "next/image";
import { notFound } from "next/navigation";
import { Uploader } from "@/components/clinic/Uploader";
import { PageTitle } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { isLang } from "@/i18n/config";
import { getDict } from "@/i18n";
import { requireUser } from "@/lib/auth/session";
import { imageUrl } from "@/lib/cloudinary";
import { cloudinaryConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getOwnDoctor } from "@/services/doctors";
import { DoctorForm, type DoctorFormData } from "../DoctorForm";

const EMPTY: DoctorFormData = {
  name: { en: "", ur: "" },
  specialty: { en: "", ur: "" },
  qualifications: "",
  bio: { en: "", ur: "" },
  slotMinutes: 30,
  weekly: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start: "10:00", end: "18:00", breaks: [] })),
  blockedDates: [],
  active: true,
};

export default async function DoctorEditPage({ params }: PageProps<"/[lang]/dashboard/doctors/[id]">) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const user = await requireUser("clinic_owner");

  let data = EMPTY;
  let photo: { publicId: string } | undefined;
  if (id !== "new") {
    try {
      const doc = await getOwnDoctor(user.id, id);
      photo = doc.photo;
      data = {
        id: String(doc._id),
        name: { en: doc.name.en, ur: doc.name.ur ?? "" },
        gender: doc.gender,
        specialty: { en: doc.specialty?.en ?? "", ur: doc.specialty?.ur ?? "" },
        qualifications: doc.qualifications,
        bio: { en: doc.bio?.en ?? "", ur: doc.bio?.ur ?? "" },
        slotMinutes: doc.slotMinutes,
        weekly: doc.weekly.map((w) => ({ weekday: w.weekday, start: w.start, end: w.end, breaks: w.breaks.map((b) => ({ start: b.start, end: b.end })) })),
        blockedDates: doc.blockedDates,
        active: doc.active,
      };
    } catch (err) {
      if (err instanceof AppError && err.code === "not_found") notFound();
      throw err;
    }
  }
  const uploads = cloudinaryConfigured();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={data.id ? t.dashboard.editDoctor : t.dashboard.addDoctor} />
      {data.id ? (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-lg">{t.dashboard.doctorPhoto}</h2>
          {photo && uploads ? (
            <Image
              src={imageUrl(photo.publicId, { width: 160, height: 160 })}
              alt={data.name.en}
              width={160}
              height={160}
              unoptimized
              className="h-32 w-32 rounded-md object-cover"
            />
          ) : null}
          {uploads ? (
            <Uploader
              kind="doctorPhoto"
              doctorId={data.id}
              accept="image/jpeg,image/png,image/webp"
              labels={{
                button: t.dashboard.addPhoto,
                uploading: t.dashboard.uploading,
                failed: t.dashboard.uploadFailed,
                tooBig: t.dashboard.fileTooBig,
                notConfigured: t.dashboard.uploadsNotConfigured,
              }}
            />
          ) : (
            <p className="text-sm text-muted">{t.dashboard.uploadsNotConfigured}</p>
          )}
        </Card>
      ) : null}
      <DoctorForm lang={lang} t={{ d: t.dashboard, c: t.common }} data={data} />
    </div>
  );
}
