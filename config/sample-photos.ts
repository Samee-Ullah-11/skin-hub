/**
 * SAMPLE photos used until real ones are uploaded. They are only shown for SAMPLE clinics
 * and for treatments without their own image. Before launch, make sure you have the right
 * to use every photo here (and patient consent for any photo showing a patient), or replace them.
 */
export const SAMPLE_PHOTOS = {
  consultation: "/samples/photos/skin-consultation.jpg",
  facialDevice: "/samples/photos/facial-device.jpg",
  injections: "/samples/photos/aesthetic-injections.jpg",
  skinRenewal: "/samples/photos/skin-renewal.jpg",
  dermatologyExam: "/samples/photos/dermatology-exam.jpg",
} as const;

const ALL = Object.values(SAMPLE_PHOTOS);

/** A stable number from a slug, so each sample clinic always gets the same photo. */
function seed(slug: string) {
  return [...slug].reduce((a, ch) => a + ch.charCodeAt(0), 0);
}

/** Cover photo for a sample clinic (banner and card). */
export function sampleClinicCover(slug: string): string {
  const covers = [SAMPLE_PHOTOS.consultation, SAMPLE_PHOTOS.facialDevice, SAMPLE_PHOTOS.injections];
  return covers[seed(slug) % covers.length];
}

/** Gallery for a sample clinic: every sample photo, starting from its cover. */
export function sampleClinicGallery(slug: string): string[] {
  const start = ALL.indexOf(sampleClinicCover(slug) as (typeof ALL)[number]);
  return ALL.map((_, i) => ALL[(start + i) % ALL.length]);
}

/** Photo per treatment slug, for treatments that have no uploaded image. */
const TREATMENT_PHOTOS: Record<string, string> = {
  "acne-treatment": SAMPLE_PHOTOS.consultation,
  "laser-hair-removal": SAMPLE_PHOTOS.facialDevice,
  "skin-whitening": SAMPLE_PHOTOS.skinRenewal,
  facials: SAMPLE_PHOTOS.facialDevice,
  "chemical-peel": SAMPLE_PHOTOS.skinRenewal,
  "pigmentation-treatment": SAMPLE_PHOTOS.consultation,
  "scar-treatment": SAMPLE_PHOTOS.dermatologyExam,
  "hair-loss-treatment": SAMPLE_PHOTOS.consultation,
  prp: SAMPLE_PHOTOS.injections,
  "botox-fillers": SAMPLE_PHOTOS.injections,
  "mole-wart-removal": SAMPLE_PHOTOS.dermatologyExam,
  microneedling: SAMPLE_PHOTOS.skinRenewal,
};

export function sampleTreatmentPhoto(slug: string): string {
  return TREATMENT_PHOTOS[slug] ?? ALL[seed(slug) % ALL.length];
}
