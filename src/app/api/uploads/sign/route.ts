import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { signUpload } from "@/lib/cloudinary";
import { readJson, route } from "@/lib/http";
import { hitLimit, LIMITS } from "@/lib/rate-limit";
import { requireOwnClinic } from "@/services/clinics";

const schema = z.object({ kind: z.enum(["photo", "doctorPhoto", "document"]) });

export const POST = route(async (req) => {
  const user = await requireUser("clinic_owner");
  await hitLimit(LIMITS.upload, user.id);
  const { kind } = await readJson(req, schema);
  const clinic = await requireOwnClinic(user.id);
  return NextResponse.json(signUpload(String(clinic._id), kind));
});
