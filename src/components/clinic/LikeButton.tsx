"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { GUEST_LIKES_COOKIE, parseGuestLikes, serializeGuestLikes } from "@/lib/guest-likes";

export type LikeMode = "account" | "guest" | "none";

function readGuestLikes(): string[] {
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${GUEST_LIKES_COOKIE}=`));
  return parseGuestLikes(raw?.slice(GUEST_LIKES_COOKIE.length + 1));
}

function writeGuestLikes(ids: string[]) {
  const value = encodeURIComponent(serializeGuestLikes(ids));
  document.cookie = `${GUEST_LIKES_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
}

/**
 * Heart button. Patients save to their account; visitors who are not logged in save in a browser
 * cookie (moved into their account when they log in). Hidden for clinic and admin accounts.
 */
export function LikeButton({
  clinicId,
  initialLiked,
  initialCount,
  mode,
  labels,
}: {
  clinicId: string;
  initialLiked: boolean;
  initialCount: number;
  mode: LikeMode;
  labels: { like: string; liked: string };
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  if (mode === "none") return null;

  async function toggle() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));

    if (mode === "guest") {
      const ids = readGuestLikes().filter((id) => id !== clinicId);
      writeGuestLikes(nextLiked ? [clinicId, ...ids] : ids);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clinicId }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked(liked);
      setCount(count);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? labels.liked : labels.like}
      title={liked ? labels.liked : labels.like}
      className={`shadow-soft inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-surface/95 px-2.5 text-sm font-semibold backdrop-blur transition-transform hover:scale-105 active:scale-95 ${
        liked ? "text-danger" : "text-ink hover:text-danger"
      }`}
    >
      <Icon name="heart" size={20} filled={liked} />
      {count > 0 ? <span className="tabular-nums">{count}</span> : null}
    </button>
  );
}
