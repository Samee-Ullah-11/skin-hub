import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { readJson, route } from "@/lib/http";
import { toggleLike } from "@/services/engagement";
import { objectId } from "@/validation/common";

export const POST = route(async (req) => {
  const user = await requireUser("patient");
  const { clinicId } = await readJson(req, z.object({ clinicId: objectId }));
  return NextResponse.json(await toggleLike(user.id, clinicId));
});
