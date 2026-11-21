import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { apiOptions, jsonWithCors, publicErrorMessage } from "@/lib/server/http";
import { requireApiCaller } from "@/lib/server/auth";
import { validateReviewInput } from "@/lib/reviews/calculation";
import { recalculateServiceRating, recalculateTechnicianRating } from "@/lib/server/reviews/service-rating";
import type { ReviewDoc } from "@/lib/reviews/types";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

/**
 * GET /api/reviews?serviceId=xxx or ?bookingId=yyy
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = String(searchParams.get("serviceId") || "").trim();
    const bookingId = String(searchParams.get("bookingId") || "").trim();

    const db = getAdminDb();

    if (bookingId) {
      const snap = await db.doc(`reviews/${bookingId}`).get();
      if (!snap.exists) {
        return jsonWithCors(req, { ok: true, review: null });
      }
      const data = snap.data() as Record<string, unknown>;
      return jsonWithCors(req, {
        ok: true,
        review: {
          id: snap.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt as { toDate?: () => Date }).toDate?.()?.toISOString() || data.createdAt : null,
          updatedAt: data.updatedAt ? (data.updatedAt as { toDate?: () => Date }).toDate?.()?.toISOString() || data.updatedAt : null,
        },
      });
    }

    if (serviceId) {
      const snap = await db
        .collection("reviews")
        .where("serviceId", "==", serviceId)
        .where("status", "==", "published")
        .get();

      const reviews: ReviewDoc[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          reviewId: String(data.reviewId || d.id),
          bookingId: String(data.bookingId || d.id),
          customerId: String(data.customerId || ""),
          customerName: String(data.customerName || "Customer"),
          customerPhone: data.customerPhone ? String(data.customerPhone) : undefined,
          serviceId: String(data.serviceId || serviceId),
          serviceName: data.serviceName ? String(data.serviceName) : undefined,
          serviceTypeId: data.serviceTypeId ? String(data.serviceTypeId) : undefined,
          serviceTypeName: data.serviceTypeName ? String(data.serviceTypeName) : undefined,
          rating: Number(data.rating || 5),
          comment: String(data.comment || ""),
          isVerified: Boolean(data.isVerified ?? true),
          status: "published",
          createdAt: data.createdAt ? (data.createdAt as { toDate?: () => Date }).toDate?.()?.toISOString() || data.createdAt : new Date().toISOString(),
          updatedAt: data.updatedAt ? (data.updatedAt as { toDate?: () => Date }).toDate?.()?.toISOString() || data.updatedAt : new Date().toISOString(),
        };
      });

      // Sort newest first
      reviews.sort((a, b) => {
        const timeA = new Date(String(a.createdAt || 0)).getTime();
        const timeB = new Date(String(b.createdAt || 0)).getTime();
        return timeB - timeA;
      });

      return jsonWithCors(req, {
        ok: true,
        reviews,
        total: reviews.length,
      });
    }

    return jsonWithCors(req, { error: "Missing serviceId or bookingId query parameter" }, { status: 400 });
  } catch (err) {
    return jsonWithCors(req, { error: publicErrorMessage(err, "Failed to load reviews") }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 * Submit or update a review for a completed booking.
 */
export async function POST(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const validation = validateReviewInput(body);
    if (!validation.valid || validation.rating == null) {
      return jsonWithCors(req, { error: validation.error || "Invalid review data" }, { status: 400 });
    }

    const bookingId = String(body.bookingId).trim();
    const stars = validation.rating;
    const comment = validation.comment || "";

    const db = getAdminDb();
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const reviewRef = db.doc(`reviews/${bookingId}`);

    let serviceIdToRecalculate = "";
    let technicianIdToRecalculate = "";
    let finalReview: Record<string, unknown> | null = null;

    await db.runTransaction(async (txn) => {
      const bSnap = await txn.get(bookingRef);
      if (!bSnap.exists) {
        throw Object.assign(new Error("Booking not found"), { status: 404 });
      }

      const booking = (bSnap.data() || {}) as Record<string, unknown>;
      const ownerId = String(booking.customerId ?? booking.userId ?? "");
      const ownerPhone = String(booking.customerPhone ?? "");

      // Ensure caller is authorized
      if (caller.role === "customer" && ownerId !== caller.uid) {
        throw Object.assign(new Error("You can only review your own bookings"), { status: 403 });
      }

      // Ensure booking is completed
      const bookingStatus = String(booking.status || "").toLowerCase();
      if (bookingStatus !== "completed") {
        throw Object.assign(
          new Error("Reviews can only be submitted for completed bookings"),
          { status: 400 },
        );
      }

      const rSnap = await txn.get(reviewRef);
      const isEdit = rSnap.exists;
      const existingReview = isEdit ? (rSnap.data() as Record<string, unknown>) : null;

      const serviceId = String(booking.serviceId || existingReview?.serviceId || "").trim();
      const techId = String(booking.technicianId || booking.assignedTechnicianId || "").trim();

      serviceIdToRecalculate = serviceId;
      technicianIdToRecalculate = techId;

      const customerName =
        String(booking.customerName || existingReview?.customerName || "Customer").trim();

      const customerPhone = String(booking.customerPhone || existingReview?.customerPhone || "").trim();

      finalReview = {
        reviewId: bookingId,
        bookingId,
        customerId: caller.uid,
        customerName,
        customerPhone,
        serviceId,
        serviceName: String(booking.serviceName || existingReview?.serviceName || "Service"),
        serviceTypeId: String(booking.serviceTypeId || existingReview?.serviceTypeId || ""),
        serviceTypeName: String(booking.serviceTypeName || existingReview?.serviceTypeName || ""),
        rating: stars,
        comment,
        isVerified: true,
        status: existingReview?.status === "hidden" ? "hidden" : "published",
        createdAt: isEdit ? existingReview?.createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Upsert review document
      txn.set(reviewRef, finalReview, { merge: true });

      // Update booking document
      txn.update(bookingRef, {
        customerRating: stars,
        customerReview: comment,
        hasReview: true,
        reviewId: bookingId,
        ratedAt: FieldValue.serverTimestamp(),
        lifecycleStatus: "RATED",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // Recompute service ratings outside transaction
    if (serviceIdToRecalculate) {
      await recalculateServiceRating(db, serviceIdToRecalculate).catch(() => {});
    }

    if (technicianIdToRecalculate) {
      await recalculateTechnicianRating(db, technicianIdToRecalculate).catch(() => {});
    }

    return jsonWithCors(req, {
      ok: true,
      message: "Review submitted successfully",
      review: {
        id: bookingId,
        bookingId,
        rating: stars,
        comment,
        isVerified: true,
      },
    });
  } catch (err) {
    const status = Number((err as { status?: number })?.status) || 500;
    return jsonWithCors(req, { error: publicErrorMessage(err, "Failed to submit review") }, { status });
  }
}
