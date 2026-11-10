import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { readJson, route } from "@/lib/http";
import { confirmUpload } from "@/services/documents";
import { objectId } from "@/validation/common";

const schema = z.object({
  kind: z.enum(["photo", "doctorPhoto", "document"]),
  publicId: z.string().min(5).max(300),
  docType: z.string().max(60).optional(),
  doctorId: objectId.optional(),
  originalName: z.string().max(200).optional(),
  alt: z.string().max(160).optional(),
});

export const POST = route(async (req) => {
  const user = await requireUser("clinic_owner");
  const input = await readJson(req, schema);
  await confirmUpload(user, input);
  return NextResponse.json({ ok: true });
});
