import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { calculateServiceRatingStats } from "@/lib/reviews/calculation";
import type { ServiceRatingStats } from "@/lib/reviews/types";

/**
 * Re-computes and saves aggregate ratings and distribution on the service document
 * using all published reviews for that service.
 */
export async function recalculateServiceRating(
  db: Firestore,
  serviceId: string,
): Promise<ServiceRatingStats> {
  const cleanServiceId = String(serviceId || "").trim();
  if (!cleanServiceId) {
    return {
      averageRating: null,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  // Fetch all published reviews for this service
  const reviewsSnap = await db
    .collection("reviews")
    .where("serviceId", "==", cleanServiceId)
    .where("status", "==", "published")
    .get();

  const reviews = reviewsSnap.docs.map((d) => d.data() as { rating: number; status?: string });
  const stats = calculateServiceRatingStats(reviews);

  const serviceRef = db.doc(`services/${cleanServiceId}`);
  const serviceSnap = await serviceRef.get();

  if (serviceSnap.exists) {
    await serviceRef.update({
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
      ratingDistribution: stats.distribution,
      ratingStatsUpdatedAt: FieldValue.serverTimestamp(),
    });
  }

  return stats;
}

/**
 * Updates technician ratings based on their reviews/ratings.
 */
export async function recalculateTechnicianRating(
  db: Firestore,
  technicianId: string,
): Promise<{ rating: number; count: number } | null> {
  const cleanTechId = String(technicianId || "").trim();
  if (!cleanTechId) return null;

  const techRef = db.doc(`technicians/${cleanTechId}`);
  const techSnap = await techRef.get();
  if (!techSnap.exists) return null;

  // Query completed bookings for this technician with a customer rating
  const bookingsSnap = await db
    .collection("bookings")
    .where("technicianId", "==", cleanTechId)
    .where("status", "==", "Completed")
    .get();

  const ratings: number[] = [];
  for (const doc of bookingsSnap.docs) {
    const data = doc.data();
    if (typeof data.customerRating === "number" && data.customerRating >= 1 && data.customerRating <= 5) {
      ratings.push(data.customerRating);
    }
  }

  if (ratings.length === 0) {
    return null;
  }

  const sum = ratings.reduce((acc, curr) => acc + curr, 0);
  const count = ratings.length;
  const avg = Math.round((sum / count) * 10) / 10;

  await techRef.update({
    rating: avg,
    averageRating: avg,
    ratingCount: count,
    totalRatings: count,
    totalReviews: count,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { rating: avg, count };
}
