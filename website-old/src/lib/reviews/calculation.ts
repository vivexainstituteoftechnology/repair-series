import type { RatingDistribution, ReviewDoc, ServiceRatingStats } from "./types";

/**
 * Computes average rating, total reviews, and star distribution from an array of reviews.
 * Formula: Average Rating = Total Sum of Ratings / Total Number of Reviews
 * Rounded to 1 decimal place. Only 'published' reviews are counted.
 */
export function calculateServiceRatingStats(
  reviews: Array<{ rating: number; status?: string }>,
): ServiceRatingStats {
  const distribution: RatingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const published = (reviews || []).filter(
    (r) => !r.status || r.status === "published",
  );

  if (published.length === 0) {
    return {
      averageRating: null,
      totalReviews: 0,
      distribution,
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  let totalScore = 0;
  for (const r of published) {
    const raw = Number(r.rating);
    const star = Math.max(1, Math.min(5, Math.round(Number.isFinite(raw) ? raw : 5)));
    totalScore += star;
    distribution[star as keyof RatingDistribution] =
      (distribution[star as keyof RatingDistribution] || 0) + 1;
  }

  const totalReviews = published.length;
  const rawAvg = totalScore / totalReviews;
  const averageRating = Math.round(rawAvg * 10) / 10;

  const percentages = {
    1: Math.round((distribution[1] / totalReviews) * 100),
    2: Math.round((distribution[2] / totalReviews) * 100),
    3: Math.round((distribution[3] / totalReviews) * 100),
    4: Math.round((distribution[4] / totalReviews) * 100),
    5: Math.round((distribution[5] / totalReviews) * 100),
  };

  return {
    averageRating,
    totalReviews,
    distribution,
    percentages,
  };
}

/**
 * Returns a privacy-friendly display name for customer reviews:
 * "Rahul Sharma" -> "Rahul S."
 * "Rahul" -> "Rahul"
 * "+919876543210" -> "Customer ···3210"
 * Empty -> "Verified Customer"
 */
export function formatCustomerDisplayName(
  name?: string | null,
  phone?: string | null,
): string {
  const trimmed = String(name || "").trim();
  if (trimmed && !/^\+?\d{7,15}$/.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0];
    const first = parts[0];
    const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
    return `${first} ${lastInitial}.`;
  }

  const cleanPhone = String(phone || trimmed || "").replace(/\D/g, "");
  if (cleanPhone.length >= 4) {
    return `Customer ···${cleanPhone.slice(-4)}`;
  }

  return "Verified Customer";
}

/**
 * Validates a rating submission (1-5 integer, optional comment up to 2000 chars).
 */
export function validateReviewInput(input: {
  bookingId?: unknown;
  rating?: unknown;
  comment?: unknown;
}): { valid: boolean; error?: string; rating?: number; comment?: string } {
  const bookingId = String(input?.bookingId || "").trim();
  if (!bookingId) {
    return { valid: false, error: "Missing booking ID" };
  }

  const ratingNum = Number(input?.rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { valid: false, error: "Please select a star rating between 1 and 5" };
  }

  const stars = Math.round(ratingNum);
  const commentStr = String(input?.comment ?? "").trim();
  if (commentStr.length > 2000) {
    return { valid: false, error: "Review comment cannot exceed 2000 characters" };
  }

  return {
    valid: true,
    rating: stars,
    comment: commentStr,
  };
}
