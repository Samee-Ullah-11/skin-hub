import { sampleTreatmentPhoto } from "@config/sample-photos";
import { imageUrl } from "@/lib/cloudinary";
import { cloudinaryConfigured } from "@/lib/env";

/** A treatment's own uploaded image when there is one, otherwise its SAMPLE photo. */
export function treatmentImage(tr: { slug: string; imagePublicId?: string }, size = { width: 800, height: 600 }) {
  if (tr.imagePublicId && cloudinaryConfigured()) return { src: imageUrl(tr.imagePublicId, size), sample: false };
  return { src: sampleTreatmentPhoto(tr.slug), sample: true };
}
