"use client";

import { useEffect, useState } from "react";
import { StarRatingInput } from "./star-rating";
import { getIdTokenSafe } from "@/lib/firebase/auth";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceName?: string;
  initialRating?: number;
  initialComment?: string;
  onSuccess?: (review: { rating: number; comment: string }) => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  bookingId,
  serviceName = "Service",
  initialRating = 5,
  initialComment = "",
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(initialRating || 5);
  const [comment, setComment] = useState<string>(initialComment || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating || 5);
      setComment(initialComment || "");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialRating, initialComment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const token = await getIdTokenSafe();
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess({ rating, comment: comment.trim() });
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[24px] bg-white p-6 sm:p-8 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="mx-auto size-14 text-emerald-500 animate-in zoom-in duration-300" />
            <h3 className="text-xl font-extrabold text-[#0a0f1c]">
              Thank You for Your Review!
            </h3>
            <p className="text-sm text-[#64748b]">
              Your rating and feedback help us maintain top service quality.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[#0a0f1c]">
                {initialRating ? "Edit Your Review" : "Rate Your Service"}
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">
                {serviceName} · Booking #{bookingId.slice(-6).toUpperCase()}
              </p>
            </div>

            {/* Interactive Stars */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-3">
                Tap to rate
              </div>
              <StarRatingInput
                value={rating}
                onChange={setRating}
                disabled={busy}
                size={38}
              />
            </div>

            {/* Optional Written Review */}
            <div className="space-y-1.5">
              <label
                htmlFor="review-comment"
                className="block text-sm font-semibold text-[#0a0f1c]"
              >
                Written Review <span className="text-xs font-normal text-[#64748b]">(Optional)</span>
              </label>
              <textarea
                id="review-comment"
                rows={4}
                maxLength={1000}
                value={comment}
                disabled={busy}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience: service quality, technician professionalism, timeliness..."
                className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm text-[#0a0f1c] placeholder:text-[#94a3b8] focus:border-[#f96316] focus:outline-none focus:ring-1 focus:ring-[#f96316]"
              />
              <div className="flex justify-between text-xs text-[#94a3b8]">
                <span>Help other customers make informed choices</span>
                <span>{comment.length} / 1000</span>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={onClose}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="min-w-[140px] rounded-full bg-[#f96316] text-white hover:bg-[#ea580c]"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : initialRating ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
