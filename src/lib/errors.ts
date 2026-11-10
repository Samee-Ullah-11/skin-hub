export type ErrorCode =
  | "unauthenticated"
  | "bad_credentials"
  | "forbidden"
  | "not_found"
  | "validation"
  | "rate_limited"
  | "conflict"
  | "slot_taken"
  | "too_many_pending"
  | "email_unverified"
  | "invalid_state"
  | "bad_origin"
  | "upload_invalid"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
  unauthenticated: 401,
  bad_credentials: 401,
  forbidden: 403,
  not_found: 404,
  validation: 400,
  rate_limited: 429,
  conflict: 409,
  slot_taken: 409,
  too_many_pending: 409,
  email_unverified: 403,
  invalid_state: 409,
  bad_origin: 403,
  upload_invalid: 400,
  internal: 500,
};

export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message ?? code);
    this.status = STATUS[code];
  }
}

export const notFound = () => new AppError("not_found");
export const forbidden = () => new AppError("forbidden");

export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}
