"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitVouch } from "@/app/vouches/actions";
import type { Macro } from "@/lib/types";

export function VouchForm({ macros }: { macros: Pick<Macro, "id" | "name">[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedUrl(null);
    setUploadError(null);
    setPreview(URL.createObjectURL(file));
    uploadImage(file);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/vouches/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "upload failed");
      setUploadedUrl(json.publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uploadedUrl) {
      setErrorMsg(uploading ? "still uploading..." : "attach a screenshot first");
      setStatus("error");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("image_url", uploadedUrl);

    startTransition(async () => {
      const result = await submitVouch(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        setStatus("error");
      } else {
        setStatus("success");
        formRef.current?.reset();
        setPreview(null);
        setUploadedUrl(null);
        router.refresh();
      }
    });
  }

  if (status === "success") {
    return (
      <p className="text-sm text-lime-term">&gt; vouch submitted. thanks.</p>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Image upload */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-lime-dim">
          screenshot *
        </label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="w-full border border-lime-term/40 bg-black px-3 py-2 text-xs text-lime-term file:mr-3 file:border-0 file:bg-lime-term file:px-3 file:py-1 file:text-xs file:uppercase file:tracking-widest file:text-black"
        />
        {uploadError && (
          <p className="mt-1 text-xs text-red-400">[error] {uploadError}</p>
        )}
        {uploading && (
          <p className="mt-1 text-xs text-lime-dim">&gt; uploading...</p>
        )}
        {uploadedUrl && !uploading && (
          <p className="mt-1 text-xs text-lime-term">&gt; upload ready</p>
        )}
      </div>

      {/* Image preview */}
      {preview && (
        <div className="relative overflow-hidden border border-lime-term/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="preview"
            className="max-h-64 w-full object-contain bg-black"
          />
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_2px,rgba(0,0,0,0.15)_4px)]" />
        </div>
      )}

      {/* Macro selector */}
      {macros.length > 0 && (
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-lime-dim">
            which macro? (optional)
          </label>
          <select
            name="macro_id"
            defaultValue=""
            className="w-full border border-lime-term/40 bg-black px-3 py-2 text-sm text-lime-term focus:border-lime-term focus:outline-none"
          >
            <option value="">-- general vouch --</option>
            {macros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Caption */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-lime-dim">
          caption (optional)
        </label>
        <input
          name="caption"
          type="text"
          maxLength={300}
          placeholder="e.g. scanned clean on virustotal, works great"
          className="w-full border border-lime-term/40 bg-black px-3 py-2 text-sm text-lime-term placeholder:text-lime-term/30 focus:border-lime-term focus:outline-none"
        />
      </div>

      {/* Author name */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-lime-dim">
          your name (optional)
        </label>
        <input
          name="author_name"
          type="text"
          maxLength={50}
          placeholder="anonymous"
          className="w-full border border-lime-term/40 bg-black px-3 py-2 text-sm text-lime-term placeholder:text-lime-term/30 focus:border-lime-term focus:outline-none"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-400">[error] {errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-fit border border-lime-term px-4 py-2 text-xs uppercase tracking-wider transition-colors hover:bg-lime-term hover:text-black disabled:opacity-50"
      >
        {isPending ? "> submitting..." : "> submit vouch"}
      </button>
    </form>
  );
}
