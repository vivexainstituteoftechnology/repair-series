import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { apiOptions, jsonWithCors, publicErrorMessage } from "@/lib/server/http";
import { requireApiCaller } from "@/lib/server/auth";
import { recalculateServiceRating } from "@/lib/server/reviews/service-rating";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    const allowedRoles = ["superAdmin", "serviceManager", "bookingManager", "admin"];
    if (!allowedRoles.includes(caller.role)) {
      return jsonWithCors(req, { error: "Admin access required" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      reviewId?: string;
      status?: "published" | "hidden";
    };

    const reviewId = String(body.reviewId || "").trim();
    const status = body.status === "hidden" ? "hidden" : "published";

    if (!reviewId) {
      return jsonWithCors(req, { error: "Missing reviewId" }, { status: 400 });
    }

    const db = getAdminDb();
    const reviewRef = db.doc(`reviews/${reviewId}`);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return jsonWithCors(req, { error: "Review not found" }, { status: 404 });
    }

    const reviewData = reviewSnap.data() as Record<string, unknown>;
    const serviceId = String(reviewData.serviceId || "").trim();

    await reviewRef.update({
      status,
      moderatedAt: FieldValue.serverTimestamp(),
      moderatedBy: caller.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Recompute service ratings with this review now included or excluded
    if (serviceId) {
      await recalculateServiceRating(db, serviceId);
    }

    return jsonWithCors(req, {
      ok: true,
      reviewId,
      status,
      message: status === "hidden" ? "Review has been hidden" : "Review has been published",
    });
  } catch (err) {
    const statusCode = Number((err as { status?: number })?.status) || 500;
    return jsonWithCors(req, { error: publicErrorMessage(err, "Failed to moderate review") }, { status: statusCode });
  }
}
