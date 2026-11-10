import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function jsonError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.code, fields: err.fieldErrors }, { status: err.status });
  }
  logger.error("route failed", { error: err });
  return NextResponse.json({ error: "internal" }, { status: 500 });
}

export function route<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return jsonError(err);
    }
  };
}

export async function readJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("validation", "bad_json");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] ??= i.message;
    throw new AppError("validation", "invalid_body", fields);
  }
  return parsed.data;
}
