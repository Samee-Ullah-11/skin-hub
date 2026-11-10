"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const MAX_BYTES = 5 * 1024 * 1024;

export interface UploaderLabels {
  button: string;
  uploading: string;
  failed: string;
  tooBig: string;
  notConfigured: string;
}

/**
 * Uploads straight from the browser to Cloudinary with parameters signed by our API,
 * then asks our API to verify the asset before it is saved. Files never pass through our server.
 */
export function Uploader({
  kind,
  accept,
  labels,
  docType,
  doctorId,
  alt,
}: {
  kind: "photo" | "doctorPhoto" | "document";
  accept: string;
  labels: UploaderLabels;
  docType?: string;
  doctorId?: string;
  alt?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (file.size > MAX_BYTES) {
      setError(labels.tooBig);
      return;
    }
    setBusy(true);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!signRes.ok) {
        const body = (await signRes.json().catch(() => ({}))) as { error?: string };
        setError(body.error === "upload_invalid" ? labels.notConfigured : labels.failed);
        return;
      }
      const sig = (await signRes.json()) as Record<string, string | number>;
      const fd = new FormData();
      fd.append("file", file);
      for (const key of ["api_key", "timestamp", "signature", "folder", "type", "allowed_formats"]) {
        const v = key === "api_key" ? sig.apiKey : sig[key];
        fd.append(key, String(v));
      }
      const up = await fetch(String(sig.uploadUrl), { method: "POST", body: fd });
      if (!up.ok) {
        setError(labels.failed);
        return;
      }
      const uploaded = (await up.json()) as { public_id: string };
      const confirm = await fetch("/api/uploads/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, publicId: uploaded.public_id, docType, doctorId, originalName: file.name, alt }),
      });
      if (!confirm.ok) {
        setError(labels.failed);
        return;
      }
      router.refresh();
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={`${buttonClass("secondary", "sm")} cursor-pointer self-start ${busy ? "pointer-events-none opacity-60" : ""}`}>
        <Icon name="upload" size={16} />
        {busy ? labels.uploading : labels.button}
        <input
          ref={input}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </label>
      {error ? (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
