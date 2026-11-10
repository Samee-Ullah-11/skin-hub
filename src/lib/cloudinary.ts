import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfigured, env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type UploadKind = "photo" | "doctorPhoto" | "document";

export const UPLOAD_RULES: Record<UploadKind, { formats: string[]; type: "upload" | "authenticated"; sub: string }> = {
  photo: { formats: ["jpg", "jpeg", "png", "webp"], type: "upload", sub: "photos" },
  doctorPhoto: { formats: ["jpg", "jpeg", "png", "webp"], type: "upload", sub: "doctors" },
  document: { formats: ["jpg", "jpeg", "png", "pdf"], type: "authenticated", sub: "documents" },
};

function client() {
  if (!cloudinaryConfigured()) throw new AppError("upload_invalid", "cloudinary_not_configured");
  const e = env();
  cloudinary.config({
    cloud_name: e.CLOUDINARY_CLOUD_NAME,
    api_key: e.CLOUDINARY_API_KEY,
    api_secret: e.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function clinicFolder(clinicId: string, kind: UploadKind): string {
  return `clinics/${clinicId}/${UPLOAD_RULES[kind].sub}`;
}

/** Signed parameters for a direct browser upload. The folder, delivery type and formats are fixed by the signature. */
export function signUpload(clinicId: string, kind: UploadKind) {
  const c = client();
  const rule = UPLOAD_RULES[kind];
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: clinicFolder(clinicId, kind),
    type: rule.type,
    allowed_formats: rule.formats.join(","),
  };
  const e = env();
  const signature = c.utils.api_sign_request(params, e.CLOUDINARY_API_SECRET!);
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${e.CLOUDINARY_CLOUD_NAME}/image/upload`,
    apiKey: e.CLOUDINARY_API_KEY!,
    signature,
    maxBytes: MAX_UPLOAD_BYTES,
    ...params,
  };
}

export interface VerifiedAsset {
  publicId: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
}

/** Confirms the asset exists, sits in this clinic's folder, and meets the size and format rules. Deletes it otherwise. */
export async function verifyUpload(clinicId: string, kind: UploadKind, publicId: string): Promise<VerifiedAsset> {
  const c = client();
  const rule = UPLOAD_RULES[kind];
  const folder = clinicFolder(clinicId, kind);
  if (!publicId.startsWith(`${folder}/`) || publicId.includes("..")) throw new AppError("upload_invalid", "wrong_folder");

  let res;
  try {
    res = await c.api.resource(publicId, { type: rule.type, resource_type: "image" });
  } catch {
    throw new AppError("upload_invalid", "not_found");
  }
  const ok = res.bytes <= MAX_UPLOAD_BYTES && rule.formats.includes(String(res.format).toLowerCase());
  if (!ok) {
    await c.uploader.destroy(publicId, { type: rule.type, resource_type: "image", invalidate: true });
    throw new AppError("upload_invalid", "rules");
  }
  return { publicId, format: res.format, bytes: res.bytes, width: res.width ?? 0, height: res.height ?? 0 };
}

export async function deleteAsset(publicId: string, kind: UploadKind) {
  const c = client();
  await c.uploader.destroy(publicId, { type: UPLOAD_RULES[kind].type, resource_type: "image", invalidate: true });
}

/** A download link for a private document that stops working after a few minutes. Admin use only. */
export function privateDocumentUrl(publicId: string, format: string, ttlSeconds = 300): string {
  const c = client();
  return c.utils.private_download_url(publicId, format, {
    type: "authenticated",
    resource_type: "image",
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
    attachment: false,
  });
}

export function imageUrl(publicId: string, opts: { width: number; height?: number }) {
  const name = env().CLOUDINARY_CLOUD_NAME;
  const crop = opts.height ? `c_fill,w_${opts.width},h_${opts.height}` : `c_limit,w_${opts.width}`;
  return `https://res.cloudinary.com/${name}/image/upload/${crop},f_auto,q_auto/${publicId}`;
}
