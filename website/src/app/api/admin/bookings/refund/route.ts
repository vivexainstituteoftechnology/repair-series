import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { apiOptions, jsonWithCors, publicErrorMessage } from "@/lib/server/http";
import { requireApiCaller } from "@/lib/server/auth";
import { processRazorpayRefund } from "@/lib/payments/razorpay";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    if (caller.role !== "admin" && caller.role !== "internal") {
      throw Object.assign(new Error("Admin access required"), { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      bookingId?: string;
      reason?: string;
      amount?: number;
    };

    const bookingId = String(body.bookingId || "").trim();
    if (!bookingId) {
      return jsonWithCors(req, { error: "Missing bookingId" }, { status: 400 });
    }

    const db = getAdminDb();
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const snap = await bookingRef.get();
    if (!snap.exists) {
      return jsonWithCors(req, { error: "Booking not found" }, { status: 404 });
    }

    const booking = (snap.data() || {}) as Record<string, unknown>;
    const payment = (booking.payment as Record<string, unknown> | undefined) || {};
    const paymentId = String(
      payment.razorpayPaymentId || booking.razorpayPaymentId || ""
    ).trim();

    if (!paymentId) {
      return jsonWithCors(
        req,
        { error: "No Razorpay payment ID associated with this booking" },
        { status: 400 }
      );
    }

    const cancellation = (booking.cancellation as Record<string, unknown> | undefined) || {};
    const cancellationRefund = Number(cancellation.refundAmount);
    const requestedAmount = Number(body.amount);
    const refundAmount = Number.isFinite(requestedAmount) && requestedAmount > 0
      ? requestedAmount
      : Number.isFinite(cancellationRefund) && cancellationRefund > 0
      ? cancellationRefund
      : Number(payment.amount || booking.totalAmount || 0);

    if (!refundAmount || refundAmount <= 0) {
      return jsonWithCors(req, { error: "Invalid refund amount" }, { status: 400 });
    }

    const currentRefundStatus = String(booking.refundStatus || "").toUpperCase();
    if (currentRefundStatus === "PROCESSED") {
      return jsonWithCors(req, { error: "Refund already processed for this booking" }, { status: 400 });
    }

    // Call Razorpay Refund API
    const refundResult = await processRazorpayRefund({
      paymentId,
      amountPaise: Math.round(refundAmount * 100),
      notes: {
        bookingId,
        refundedBy: caller.uid,
        reason: body.reason || "Booking cancellation refund",
      },
    });

    // Record refund state in Firestore
    await bookingRef.update({
      refundStatus: "PROCESSED",
      "payment.status": "REFUNDED",
      refund: {
        refundId: refundResult.refundId,
        amount: refundAmount,
        currency: "INR",
        status: refundResult.status,
        processedAt: FieldValue.serverTimestamp(),
        processedBy: caller.uid,
        reason: body.reason || "Admin cancellation refund",
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return jsonWithCors(req, {
      ok: true,
      refundId: refundResult.refundId,
      amount: refundAmount,
      status: "PROCESSED",
    });
  } catch (err) {
    const status = Number((err as { status?: number })?.status) || 500;
    return jsonWithCors(req, { error: publicErrorMessage(err, "Refund failed") }, { status });
  }
}
