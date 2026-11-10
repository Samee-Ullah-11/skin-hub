/** Likes from visitors who are not logged in live in this cookie as comma-separated clinic IDs. */
export const GUEST_LIKES_COOKIE = "guest_likes";
export const GUEST_LIKES_MAX = 50;

export function parseGuestLikes(value: string | undefined | null): string[] {
  if (!value) return [];
  const ids = decodeURIComponent(value)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-f0-9]{24}$/.test(s));
  return [...new Set(ids)].slice(0, GUEST_LIKES_MAX);
}

export function serializeGuestLikes(ids: string[]): string {
  return [...new Set(ids)].slice(0, GUEST_LIKES_MAX).join(",");
}
