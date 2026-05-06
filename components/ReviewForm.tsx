"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/app/reviews/actions";

export function ReviewForm({
  macroId,
  macroSlug,
}: {
  macroId: string;
  macroSlug: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg("pick a star rating first");
      setStatus("error");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("rating", String(rating));

    startTransition(async () => {
      const result = await submitReview(formData);
      if (result?.error) {
        setErrorMsg(result.error);
        setStatus("error");
      } else {
        setStatus("success");
        formRef.current?.reset();
        setRating(0);
        router.refresh();
      }
    });
  }

  if (status === "success") {
    return (
      <p className="text-sm text-lime-term">&gt; review submitted. thanks.</p>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="macro_id" value={macroId} />
      <input type="hidden" name="macro_slug" value={macroSlug} />

      {/* Star picker */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-lime-dim">
          rating *
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`text-2xl leading-none transition-colors ${
                star <= (hover || rating)
                  ? "text-lime-term"
                  : "text-lime-term/25"
              }`}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-xs text-lime-dim">{rating} / 5</span>
          )}
        </div>
      </div>

      {/* Author name */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-lime-dim">
          name
        </label>
        <input
          name="author_name"
          type="text"
          maxLength={50}
          placeholder="anonymous"
          className="w-full border border-lime-term/40 bg-black px-3 py-2 text-sm text-lime-term placeholder:text-lime-term/30 focus:border-lime-term focus:outline-none"
        />
      </div>

      {/* Review body */}
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-lime-dim">
          review (optional)
        </label>
        <textarea
          name="body"
          rows={3}
          maxLength={1000}
          placeholder="> write your thoughts..."
          className="w-full resize-none border border-lime-term/40 bg-black px-3 py-2 text-sm text-lime-term placeholder:text-lime-term/30 focus:border-lime-term focus:outline-none"
        />
      </div>

      {/* Safety vote */}
      <div>
        <label className="mb-2 block text-xs uppercase tracking-widest text-lime-dim">
          safety check (optional)
        </label>
        <div className="flex flex-wrap gap-4">
          {[
            { value: "safe", label: "✓ SAFE", cls: "text-lime-term" },
            { value: "unsure", label: "? UNSURE", cls: "text-yellow-400" },
            { value: "virus", label: "⚠ VIRUS", cls: "text-red-400" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-1.5"
            >
              <input
                type="radio"
                name="safety_vote"
                value={opt.value}
                className="accent-lime-500"
              />
              <span className={`text-xs font-mono ${opt.cls}`}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {status === "error" && (
        <p className="text-xs text-red-400">[error] {errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit border border-lime-term px-4 py-2 text-xs uppercase tracking-wider transition-colors hover:bg-lime-term hover:text-black disabled:opacity-50"
      >
        {isPending ? "> submitting..." : "> submit review"}
      </button>
    </form>
  );
}
