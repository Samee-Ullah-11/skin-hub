import { Banner } from "@/components/ui/Banner";
import type { Dict } from "@/i18n";
import type { Lang } from "@/i18n/config";
import type { ClinicDoc } from "@/models/Clinic";
import { getClinicDisplayData } from "@/services/clinics";
import { ClinicProfile } from "./ClinicProfile";

/** Renders the public profile from current data, in public colours, inside the dashboard. Callers check access. */
export async function ClinicPreview({ lang, t, clinic }: { lang: Lang; t: Dict; clinic: ClinicDoc }) {
  const display = await getClinicDisplayData(clinic);
  return (
    <div data-role="public" className="overflow-hidden rounded-lg border-2 border-dashed border-primary bg-page">
      <div className="p-3">
        <Banner tone="pending" title={t.dashboard.previewBanner} />
      </div>
      <ClinicProfile
        lang={lang}
        t={t}
        clinic={clinic}
        display={display}
        booking={<p className="text-muted">{t.dashboard.previewNote}</p>}
        embedded
      />
    </div>
  );
}
