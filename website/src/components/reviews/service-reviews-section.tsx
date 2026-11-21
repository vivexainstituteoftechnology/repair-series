"use client";

import { useEffect, useState } from "react";
import { StarRatingDisplay } from "./star-rating";
import { calculateServiceRatingStats, formatCustomerDisplayName } from "@/lib/reviews/calculation";
import type { ReviewDoc, ServiceRatingStats } from "@/lib/reviews/types";
import { CheckCircle2, MessageSquare, ShieldCheck, Star } from "lucide-react";

interface ServiceReviewsSectionProps {
  serviceId: string;
  serviceName?: string;
  initialRating?: number | null;
  initialReviewCount?: number;
  initialDistribution?: Record<number, number>;
}

export function ServiceReviewsSection({
  serviceId,
  serviceName = "Service",
  initialRating,
  initialReviewCount = 0,
  initialDistribution,
}: ServiceReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ServiceRatingStats>(() => {
    if (typeof initialRating === "number" && initialReviewCount > 0) {
      const dist = {
        1: Number(initialDistribution?.[1] || 0),
        2: Number(initialDistribution?.[2] || 0),
        3: Number(initialDistribution?.[3] || 0),
        4: Number(initialDistribution?.[4] || 0),
        5: Number(initialDistribution?.[5] || 0),
      };
      return {
        averageRating: initialRating,
        totalReviews: initialReviewCount,
        distribution: dist,
        percentages: {
          1: Math.round((dist[1] / initialReviewCount) * 100),
          2: Math.round((dist[2] / initialReviewCount) * 100),
          3: Math.round((dist[3] / initialReviewCount) * 100),
          4: Math.round((dist[4] / initialReviewCount) * 100),
          5: Math.round((dist[5] / initialReviewCount) * 100),
        },
      };
    }
    return {
      averageRating: null,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  });
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (!serviceId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews?serviceId=${encodeURIComponent(serviceId)}`);
        if (!res.ok) throw new Error("Failed to load reviews");
        const data = await res.json();
        if (cancelled) return;

        const items: ReviewDoc[] = Array.isArray(data.reviews) ? data.reviews : [];
        setReviews(items);

        const computedStats = calculateServiceRatingStats(items);
        setStats(computedStats);
      } catch {
        // Keep fallback initial stats if error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const hasReviews = (stats.totalReviews || reviews.length) > 0;
  const displayedReviews = reviews.slice(0, visibleCount);

  return (
    <section
      id="customer-reviews"
      aria-labelledby="customer-reviews-heading"
      className="mt-12 sm:mt-16 border-t border-gray-200/80 pt-10 sm:pt-14"
    >
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="customer-reviews-heading"
            className="text-2xl font-black tracking-tight text-[#0a0f1c] sm:text-3xl"
          >
            Customer Reviews & Ratings
          </h2>
          <p className="mt-1 text-sm text-[#64748b]">
            Genuine feedback and ratings from customers with verified completed bookings.
          </p>
        </div>
      </div>

      {loading && !hasReviews ? (
        <div className="space-y-6">
          <div className="grid gap-6 rounded-[24px] border border-black/5 bg-white p-6 sm:p-8 md:grid-cols-[240px_1fr] animate-pulse">
            <div className="h-32 rounded-2xl bg-gray-100" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-3/4 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ) : !hasReviews ? (
        /* Empty State */
        <div className="rounded-[24px] border border-black/5 bg-white p-10 sm:p-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#FFF7ED] text-[#C86A37]">
            <MessageSquare className="size-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-[#0a0f1c]">No reviews yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#64748b]">
            Be the first to share your experience! Every completed booking for {serviceName} can be rated by genuine customers.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Rating Summary Card */}
          <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            <div className="grid gap-8 md:grid-cols-[280px_1fr] md:items-center">
              {/* Left Column: Overall Score */}
              <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-6 text-center md:border-b-0 md:border-r md:pb-0 md:pr-8">
                <div className="text-5xl font-black text-[#0a0f1c] sm:text-6xl">
                  {stats.averageRating != null ? stats.averageRating.toFixed(1) : "—"}
                  <span className="text-2xl font-bold text-[#94a3b8]">/5</span>
                </div>
                <div className="mt-2.5">
                  <StarRatingDisplay
                    rating={stats.averageRating || 0}
                    size={24}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-[#64748b]">
                  Based on {stats.totalReviews} verified customer review{stats.totalReviews > 1 ? "s" : ""}
                </p>
              </div>

              {/* Right Column: Distribution Progress Bars */}
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = stats.distribution[stars as keyof typeof stats.distribution] || 0;
                  const pct = stats.percentages[stars as keyof typeof stats.percentages] || 0;

                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs sm:text-sm">
                      <div className="flex w-16 shrink-0 items-center justify-end gap-1 font-semibold text-[#0a0f1c]">
                        <span>{stars}</span>
                        <Star className="size-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                      </div>

                      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            stars >= 4
                              ? "bg-[#25D366]"
                              : stars === 3
                                ? "bg-[#F59E0B]"
                                : "bg-orange-500"
                          }`}
                        />
                      </div>

                      <div className="w-12 shrink-0 text-right font-medium text-[#64748b]">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Individual Reviews Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedReviews.map((rev) => {
              const displayName = formatCustomerDisplayName(rev.customerName, rev.customerPhone);
              const formattedDate = rev.createdAt
                ? new Date(String(rev.createdAt)).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent";

              return (
                <div
                  key={rev.id || rev.reviewId}
                  className="flex flex-col justify-between rounded-[20px] border border-black/5 bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md"
                >
                  <div>
                    {/* Header: Name + Verified Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-[#0a0f1c] truncate">{displayName}</div>
                      {rev.isVerified ? (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"
                          title="Verified customer who completed this booking"
                        >
                          <ShieldCheck className="size-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : null}
                    </div>

                    {/* Star Rating & Date */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StarRatingDisplay rating={rev.rating} size={15} />
                      <span className="text-xs text-[#94a3b8]">{formattedDate}</span>
                    </div>

                    {/* Comment text */}
                    {rev.comment ? (
                      <p className="mt-3 text-sm leading-relaxed text-[#475569]">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    ) : (
                      <p className="mt-3 text-xs italic text-[#94a3b8]">
                        Rated {rev.rating} out of 5 stars without written comments.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {reviews.length > visibleCount ? (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 6)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-gray-200 bg-white px-6 text-sm font-semibold text-[#0a0f1c] shadow-sm hover:bg-gray-50 transition-colors"
              >
                View More Reviews ({reviews.length - visibleCount} remaining)
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
