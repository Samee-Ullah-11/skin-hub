import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    MONGODB_URI: z.string().min(1),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    APP_URL: z.url(),
    EMAIL_PROVIDER: z.enum(["console", "brevo", "resend"]).default("console"),
    EMAIL_FROM: z.string().min(3).default("no-reply@localhost"),
    BREVO_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CRON_SECRET: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.EMAIL_PROVIDER === "brevo" && !v.BREVO_API_KEY) {
      ctx.addIssue({ code: "custom", path: ["BREVO_API_KEY"], message: "required when EMAIL_PROVIDER=brevo" });
    }
    if (v.EMAIL_PROVIDER === "resend" && !v.RESEND_API_KEY) {
      ctx.addIssue({ code: "custom", path: ["RESEND_API_KEY"], message: "required when EMAIL_PROVIDER=resend" });
    }
    if (v.NODE_ENV === "production") {
      for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "CRON_SECRET"] as const) {
        if (!v[key]) ctx.addIssue({ code: "custom", path: [key], message: "required in production" });
      }
      if (v.EMAIL_PROVIDER === "console") {
        ctx.addIssue({ code: "custom", path: ["EMAIL_PROVIDER"], message: "console provider is for development only" });
      }
    }
  });

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid or missing environment variables:\n${lines.join("\n")}\nSee .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

export function cloudinaryConfigured(): boolean {
  const e = env();
  return Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET);
}
