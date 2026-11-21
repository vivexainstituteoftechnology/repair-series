import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { apiOptions, jsonWithCors, publicErrorMessage } from "@/lib/server/http";
import { requireApiCaller } from "@/lib/server/auth";
import { validateReviewInput } from "@/lib/reviews/calculation";
import { recalculateServiceRating, recalculateTechnicianRating } from "@/lib/server/reviews/service-rating";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    const body = (await req.json().catch(() => ({}))) as {
      bookingId?: string;
      rating?: number;
      review?: string;
    };

    const validation = validateReviewInput({
      bookingId: body.bookingId,
      rating: body.rating,
      comment: body.review,
    });

    if (!validation.valid || validation.rating == null) {
      return jsonWithCors(req, { error: validation.error || "Invalid rating" }, { status: 400 });
    }

    const bookingId = String(body.bookingId).trim();
    const stars = validation.rating;
    const reviewText = validation.comment || "";

    const db = getAdminDb();
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const reviewRef = db.doc(`reviews/${bookingId}`);

    let serviceIdToRecalc = "";
    let techIdToRecalc = "";

    await db.runTransaction(async (txn) => {
      const snap = await txn.get(bookingRef);
      if (!snap.exists) {
        throw Object.assign(new Error("Booking not found"), { status: 404 });
      }

      const booking = (snap.data() || {}) as Record<string, unknown>;
      const ownerId = String(booking.customerId ?? booking.userId ?? "");
      const ownerPhone = String(booking.customerPhone ?? "");

      if (caller.role === "customer" && ownerId !== caller.uid) {
        throw Object.assign(new Error("Not allowed"), { status: 403 });
      }

      if (String(booking.status || "").toLowerCase() !== "completed") {
        throw Object.assign(new Error("Only completed bookings can be rated"), { status: 400 });
      }

      const rSnap = await txn.get(reviewRef);
      const isEdit = rSnap.exists;
      const existingReview = isEdit ? (rSnap.data() as Record<string, unknown>) : null;

      serviceIdToRecalc = String(booking.serviceId || existingReview?.serviceId || "").trim();
      techIdToRecalc = String(booking.technicianId || booking.assignedTechnicianId || "").trim();

      const customerName = String(
        booking.customerName || existingReview?.customerName || "Customer",
      ).trim();
      const customerPhone = String(
        booking.customerPhone || existingReview?.customerPhone || "",
      ).trim();

      // Upsert review document
      txn.set(
        reviewRef,
        {
          reviewId: bookingId,
          bookingId,
          customerId: caller.uid,
          customerName,
          customerPhone,
          serviceId: serviceIdToRecalc,
          serviceName: String(booking.serviceName || existingReview?.serviceName || "Service"),
          serviceTypeId: String(booking.serviceTypeId || existingReview?.serviceTypeId || ""),
          serviceTypeName: String(booking.serviceTypeName || existingReview?.serviceTypeName || ""),
          rating: stars,
          comment: reviewText,
          isVerified: true,
          status: existingReview?.status === "hidden" ? "hidden" : "published",
          createdAt: isEdit ? existingReview?.createdAt : FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // Update booking document
      txn.update(bookingRef, {
        customerRating: stars,
        customerReview: reviewText,
        hasReview: true,
        reviewId: bookingId,
        ratedAt: FieldValue.serverTimestamp(),
        lifecycleStatus: "RATED",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    if (serviceIdToRecalc) {
      await recalculateServiceRating(db, serviceIdToRecalc).catch(() => {});
    }

    if (techIdToRecalc) {
      await recalculateTechnicianRating(db, techIdToRecalc).catch(() => {});
    }

    return jsonWithCors(req, { ok: true, rating: stars, review: reviewText });
  } catch (err) {
    const status = Number((err as { status?: number })?.status) || 500;
    return jsonWithCors(req, { error: publicErrorMessage(err, "Failed to submit rating") }, { status });
  }
}
