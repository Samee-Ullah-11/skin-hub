import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

let dummy: Promise<string> | undefined;

/** Runs a comparison against a throwaway hash so a missing account takes as long as a wrong password. */
export async function burnPasswordCheck(plain: string): Promise<void> {
  dummy ??= bcrypt.hash("timing-equaliser", ROUNDS);
  await bcrypt.compare(plain, await dummy);
}
