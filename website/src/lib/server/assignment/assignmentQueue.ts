import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { assignPartner } from "@/lib/server/assignment/assignPartner";
import { ASSIGNMENT_STATUS, LIFECYCLE } from "@/lib/booking/lifecycle";
import { logAssignmentFailure } from "@/lib/server/assignment/assignmentLog";

export const QUEUE_COLLECTION = "partnerAssignmentQueue";
export const MAX_QUEUE_ATTEMPTS = 5;

export type QueueJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "waiting_for_partner"
  | "failed"
  | "abandoned";

export type EnqueueAssignmentInput = {
  bookingId: string;
  dateStr: string;
  slotIndex: number;
  slotLabel: string;
  categoryId: string;
  serviceTypeId?: string;
  serviceCategoryId?: string;
  userLat?: number;
  userLng?: number;
  preferredTechnicianId?: string;
  excludeTechnicianIds?: string[];
  maxAttempts?: number;
};

export type QueueProcessResult = {
  processed: number;
  assigned: number;
  waitingForPartner: number;
  failed: number;
  errors: Array<{ bookingId: string; error: string; code?: string }>;
};

/**
 * Enqueue a partner assignment job into the persistent Firestore queue.
 * Idempotent: Uses the bookingId as document ID or queries existing pending job.
 */
export async function enqueuePartnerAssignment(
  input: EnqueueAssignmentInput,
  db?: Firestore,
): Promise<string> {
  const firestore = db || getAdminDb();
  const bookingId = String(input.bookingId || "").trim();
  if (!bookingId) throw new Error("Missing bookingId for assignment queue");

  const queueRef = firestore.collection(QUEUE_COLLECTION).doc(bookingId);
  const now = FieldValue.serverTimestamp();

  await queueRef.set(
    {
      bookingId,
      status: "pending" as QueueJobStatus,
      attempts: 0,
      maxAttempts: input.maxAttempts || MAX_QUEUE_ATTEMPTS,
      dateStr: String(input.dateStr || "").trim(),
      slotIndex: Number(input.slotIndex) || 1,
      slotLabel: String(input.slotLabel || "").trim(),
      categoryId: String(input.categoryId || "").trim(),
      ...(input.serviceTypeId ? { serviceTypeId: String(input.serviceTypeId).trim() } : {}),
      ...(input.serviceCategoryId ? { serviceCategoryId: String(input.serviceCategoryId).trim() } : {}),
      ...(input.userLat != null ? { userLat: Number(input.userLat) } : {}),
      ...(input.userLng != null ? { userLng: Number(input.userLng) } : {}),
      ...(input.preferredTechnicianId
        ? { preferredTechnicianId: String(input.preferredTechnicianId).trim() }
        : {}),
      ...(Array.isArray(input.excludeTechnicianIds) && input.excludeTechnicianIds.length
        ? { excludeTechnicianIds: input.excludeTechnicianIds.map(String) }
        : {}),
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  return bookingId;
}

/**
 * Process one specific booking's assignment or a batch of pending jobs from the queue.
 * Runs atomically so only one worker can process a booking at a time.
 */
export async function processPartnerAssignmentQueue(
  opts: {
    bookingId?: string;
    limit?: number;
  } = {},
  db?: Firestore,
): Promise<QueueProcessResult> {
  const firestore = db || getAdminDb();
  const result: QueueProcessResult = {
    processed: 0,
    assigned: 0,
    waitingForPartner: 0,
    failed: 0,
    errors: [],
  };

  let jobDocs: Array<{ id: string; ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }> = [];

  if (opts.bookingId) {
    const singleRef = firestore.collection(QUEUE_COLLECTION).doc(opts.bookingId);
    const snap = await singleRef.get();
    if (snap.exists) {
      jobDocs.push({ id: snap.id, ref: singleRef, data: snap.data() || {} });
    } else {
      // If no explicit queue doc yet, synthesize one from the booking doc
      const bookingSnap = await firestore.doc(`bookings/${opts.bookingId}`).get();
      if (bookingSnap.exists) {
        const b = bookingSnap.data() || {};
        const isAlreadyAssigned = Boolean(b.technicianId) || String(b.status || "").toLowerCase() === "assigned";
        if (!isAlreadyAssigned) {
          await enqueuePartnerAssignment(
            {
              bookingId: opts.bookingId,
              dateStr: String(b.scheduledSlotDate || b.date || ""),
              slotIndex: Number(b.scheduledSlotIndex) || 1,
              slotLabel: String(b.scheduledSlotLabel || b.time || ""),
              categoryId: String(b.categoryId || ""),
              serviceTypeId: String(b.serviceTypeId || ""),
              serviceCategoryId: String(b.serviceCategoryId || ""),
              userLat: b.address?.lat,
              userLng: b.address?.lng,
            },
            firestore,
          );
          const freshSnap = await singleRef.get();
          if (freshSnap.exists) {
            jobDocs.push({ id: freshSnap.id, ref: singleRef, data: freshSnap.data() || {} });
          }
        }
      }
    }
  } else {
    const batchLimit = Math.min(25, Math.max(1, opts.limit || 10));
    const snap = await firestore
      .collection(QUEUE_COLLECTION)
      .where("status", "in", ["pending", "waiting_for_partner"])
      .orderBy("createdAt", "asc")
      .limit(batchLimit)
      .get();

    jobDocs = snap.docs.map((d) => ({
      id: d.id,
      ref: d.ref,
      data: d.data() || {},
    }));
  }

  for (const job of jobDocs) {
    result.processed += 1;
    const { id: bookingId, ref, data } = job;
    const attempts = Number(data.attempts || 0);
    const maxAttempts = Number(data.maxAttempts || MAX_QUEUE_ATTEMPTS);

    // Atomic check: Check booking to avoid reassigning already assigned booking
    const bookingRef = firestore.doc(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      await ref.update({
        status: "abandoned" as QueueJobStatus,
        lastError: "Booking document not found",
        updatedAt: FieldValue.serverTimestamp(),
      });
      result.failed += 1;
      continue;
    }

    const bookingData = bookingSnap.data() || {};
    const alreadyAssigned =
      Boolean(bookingData.technicianId) ||
      String(bookingData.status || "").toLowerCase() === "assigned";

    if (alreadyAssigned) {
      await ref.update({
        status: "completed" as QueueJobStatus,
        technicianId: bookingData.technicianId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      result.assigned += 1;
      continue;
    }

    // Mark as processing
    await ref.update({
      status: "processing" as QueueJobStatus,
      attempts: attempts + 1,
      lastAttemptAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    try {
      const mode = data.preferredTechnicianId ? "specific" : "nearest";
      const assigned = await assignPartner({
        bookingId,
        mode,
        caller: { uid: "system", role: "internal" },
        technicianId: data.preferredTechnicianId ? String(data.preferredTechnicianId) : undefined,
        dateStr: String(data.dateStr || bookingData.scheduledSlotDate || bookingData.date || ""),
        slotIndex: Number(data.slotIndex || bookingData.scheduledSlotIndex) || 1,
        slotLabel: String(data.slotLabel || bookingData.scheduledSlotLabel || bookingData.time || ""),
        categoryId: String(data.categoryId || bookingData.categoryId || ""),
        serviceTypeId: data.serviceTypeId ? String(data.serviceTypeId) : undefined,
        serviceCategoryId: data.serviceCategoryId ? String(data.serviceCategoryId) : undefined,
        userLat: data.userLat != null ? Number(data.userLat) : bookingData.address?.lat,
        userLng: data.userLng != null ? Number(data.userLng) : bookingData.address?.lng,
        excludeTechnicianIds: Array.isArray(data.excludeTechnicianIds)
          ? data.excludeTechnicianIds.map(String)
          : undefined,
      });

      await ref.update({
        status: "completed" as QueueJobStatus,
        technicianId: assigned.technicianId,
        technicianName: assigned.technicianName,
        assignedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastError: null,
      });
      result.assigned += 1;
    } catch (err) {
      const errCode = String((err as { code?: string }).code || "");
      const errMsg = String((err as Error)?.message || "Assignment failed");
      const isCapacityIssue = errCode === "ALL_TECHS_BUSY" || errCode === "NO_ELIGIBLE_PARTNER";

      logAssignmentFailure({
        stage: "queue-worker",
        bookingId,
        code: errCode,
        message: errMsg.slice(0, 180),
      });

      if (isCapacityIssue) {
        // Safe fallback: Booking stays intact in "New", status Finding Partner
        await bookingRef.update({
          lifecycleStatus: LIFECYCLE.FINDING_PARTNER,
          assignmentStatus: ASSIGNMENT_STATUS.SEARCHING,
          findingPartnerSince: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        await ref.update({
          status: "waiting_for_partner" as QueueJobStatus,
          lastError: errCode,
          updatedAt: FieldValue.serverTimestamp(),
        });
        result.waitingForPartner += 1;
      } else if (attempts + 1 >= maxAttempts) {
        // Exceeded attempts: Keep booking intact, mark queue as failed for manual admin dispatch
        await bookingRef.update({
          lifecycleStatus: LIFECYCLE.FINDING_PARTNER,
          assignmentStatus: ASSIGNMENT_STATUS.SEARCHING,
          updatedAt: FieldValue.serverTimestamp(),
        });
        await ref.update({
          status: "failed" as QueueJobStatus,
          lastError: errMsg.slice(0, 300),
          updatedAt: FieldValue.serverTimestamp(),
        });
        result.failed += 1;
      } else {
        // Retry later
        await ref.update({
          status: "pending" as QueueJobStatus,
          lastError: errMsg.slice(0, 300),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      result.errors.push({ bookingId, error: errMsg, code: errCode });
    }
  }

  return result;
}
