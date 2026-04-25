"use client";

import { useState, useTransition } from "react";
import type { Macro } from "@/lib/types";
import { slugify } from "@/lib/slug";

type Props = {
  mode: "create" | "edit";
  initial?: Macro;
  action: (formData: FormData) => Promise<void>;
};

async function uploadFile(
  file: File,
  bucket: "covers" | "screenshots" | "files",
): Promise<{ path: string; publicUrl: string | null }> {
  const body = new FormData();
  body.append("file", file);
  body.append("bucket", bucket);
  const res = await fetch("/api/upload", { method: "POST", body });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "upload failed" }));
    throw new Error(error ?? "upload failed");
  }
  return res.json();
}

export function MacroForm({ mode, initial, action }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [shortDesc, setShortDesc] = useState(initial?.short_description ?? "");
  const [longDesc, setLongDesc] = useState(initial?.long_description ?? "");
  const [version, setVersion] = useState(initial?.version ?? "");
  const [price, setPrice] = useState(
    initial ? String(initial.price_usd ?? 0) : "0",
  );
  const [published, setPublished] = useState(initial?.published ?? false);
  const [githubUrl, setGithubUrl] = useState(initial?.github_url ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtube_url ?? "");

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const raw = new FormData(form);

    startTransition(async () => {
      try {
        const formData = new FormData();

        // Copy all text fields
        for (const [key, value] of raw.entries()) {
          if (typeof value === "string") formData.append(key, value);
        }

        // Upload macro file
        const macroFileInput = form.elements.namedItem("macro_file") as HTMLInputElement;
        const macroFile = macroFileInput?.files?.[0];
        if (macroFile) {
          setUploadStatus("uploading macro file...");
          const { path } = await uploadFile(macroFile, "files");
          formData.append("file_path", path);
        }

        // Upload cover image
        const coverInput = form.elements.namedItem("cover") as HTMLInputElement;
        const coverFile = coverInput?.files?.[0];
        if (coverFile) {
          setUploadStatus("uploading cover...");
          const { publicUrl } = await uploadFile(coverFile, "covers");
          if (publicUrl) formData.append("cover_url", publicUrl);
        }

        // Upload screenshots
        const screenshotsInput = form.elements.namedItem("screenshots") as HTMLInputElement;
        const screenshotFiles = Array.from(screenshotsInput?.files ?? []);
        for (let i = 0; i < screenshotFiles.length; i++) {
          setUploadStatus(`uploading screenshot ${i + 1}/${screenshotFiles.length}...`);
          const { publicUrl } = await uploadFile(screenshotFiles[i], "screenshots");
          if (publicUrl) formData.append("screenshot_url", publicUrl);
        }

        setUploadStatus("saving...");
        await action(formData);
      } catch (err) {
        setUploadStatus("");
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          typeof (err as { digest?: unknown }).digest === "string" &&
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "submission failed");
      }
    });
  }

  const shortRemaining = 200 - shortDesc.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Field label="name" required>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="slug" required>
        <input
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          className={inputCls}
        />
      </Field>

      <Field
        label={`short description (${shortRemaining} chars left)`}
        required
      >
        <input
          name="short_description"
          required
          maxLength={200}
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="long description (markdown ok)">
        <textarea
          name="long_description"
          rows={8}
          value={longDesc ?? ""}
          onChange={(e) => setLongDesc(e.target.value)}
          className={`${inputCls} font-mono`}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="version" required>
          <input
            name="version"
            required
            placeholder="v1.0.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="price usd (0 = free)">
          <input
            name="price_usd"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label={mode === "edit" ? "cover image (leave blank to keep)" : "cover image"}>
        <input
          name="cover"
          type="file"
          accept="image/*"
          className={fileCls}
        />
        {initial?.cover_url ? (
          <p className="mt-1 text-xs text-lime-dim">
            current: {truncate(initial.cover_url, 80)}
          </p>
        ) : null}
      </Field>

      <Field
        label={
          mode === "edit"
            ? "screenshots (selecting any replaces all existing)"
            : "screenshots (select multiple)"
        }
      >
        <input
          name="screenshots"
          type="file"
          accept="image/*"
          multiple
          className={fileCls}
        />
        {initial?.screenshots?.length ? (
          <p className="mt-1 text-xs text-lime-dim">
            current: {initial.screenshots.length} image(s)
          </p>
        ) : null}
      </Field>

      <Field
        label={
          mode === "edit"
            ? "macro file (leave blank to keep current)"
            : "macro file (.ahk / .zip / .exe)"
        }
        required={mode === "create"}
      >
        <input
          name="macro_file"
          type="file"
          accept=".ahk,.zip,.exe,application/zip,application/x-msdownload"
          required={mode === "create"}
          className={fileCls}
        />
        {initial?.file_path ? (
          <p className="mt-1 text-xs text-lime-dim">
            current: {initial.file_path}
          </p>
        ) : null}
      </Field>

      <Field label="github url (optional)">
        <input
          name="github_url"
          type="url"
          placeholder="https://github.com/..."
          value={githubUrl ?? ""}
          onChange={(e) => setGithubUrl(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="youtube tutorial url (optional)">
        <input
          name="youtube_url"
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={youtubeUrl ?? ""}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-lime-dim">
          paste a youtube link — the video will embed on the macro page and tutorials section
        </p>
      </Field>

      <label className="flex items-center gap-3 text-xs uppercase tracking-widest text-lime-dim">
        <input
          name="published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-lime-term"
        />
        published (visible on home)
      </label>

      {uploadStatus && !error ? (
        <p className="text-xs text-lime-dim">&gt; {uploadStatus}</p>
      ) : null}
      {error ? <p className="text-xs text-red-400">[err] {error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="border border-lime-term bg-black px-6 py-2 text-xs uppercase tracking-widest text-lime-term hover:bg-lime-term hover:text-black disabled:opacity-50"
        >
          {pending
            ? uploadStatus || "saving..."
            : mode === "create"
              ? "> create macro"
              : "> save changes"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full border border-lime-term/40 bg-black px-3 py-2 text-sm text-lime-term outline-none focus:border-lime-term";
const fileCls =
  "w-full border border-lime-term/40 bg-black px-3 py-2 text-xs text-lime-term file:mr-3 file:border-0 file:bg-lime-term file:px-3 file:py-1 file:text-xs file:uppercase file:tracking-widest file:text-black";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest text-lime-dim">
        {label}
        {required ? <span className="text-lime-term">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "..." : s;
}
