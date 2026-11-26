import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { apiOptions, jsonWithCors, publicErrorMessage } from "@/lib/server/http";
import { requireApiCaller } from "@/lib/server/auth";
import { assertAdminPanelCaller } from "@/lib/server/adminAccess";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req);
    await assertAdminPanelCaller(caller);

    const body = (await req.json().catch(() => ({}))) as {
      partnerId?: string;
      decision?: "approve" | "reject" | "request_correction" | "suspend" | "reactivate";
      remarks?: string;
      documentStatus?: Record<string, "pending" | "approved" | "rejected" | "correction_requested">;
      services?: unknown[];
      categoryIds?: string[];
      categoryId?: string;
      assignedServiceCategories?: Record<string, unknown>;
    };

    const partnerId = String(body.partnerId || "").trim();
    if (!partnerId) {
      return jsonWithCors(req, { error: "Partner ID is required." }, { status: 400 });
    }

    const decision = body.decision;
    if (!decision) {
      return jsonWithCors(req, { error: "Verification decision is required." }, { status: 400 });
    }

    const remarks = String(body.remarks || "").trim();
    if ((decision === "reject" || decision === "request_correction") && !remarks) {
      return jsonWithCors(
        req,
        { error: "A reason or remarks is required when rejecting or requesting correction." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const partnerRef = db.doc(`technicians/${partnerId}`);
    const snap = await partnerRef.get();
    if (!snap.exists) {
      return jsonWithCors(req, { error: "Partner not found." }, { status: 404 });
    }

    const partnerData = (snap.data() || {}) as Record<string, unknown>;
    const nowIso = new Date().toISOString();
    const adminIdentifier = (caller as unknown as { email?: string }).email || caller.uid;

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docStatuses = body.documentStatus || {};

    if (decision === "approve") {
      updates["kyc.status"] = "approved";
      updates["kyc.reviewedAt"] = nowIso;
      updates["kyc.reviewedBy"] = adminIdentifier;
      updates["kyc.adminRemarks"] = remarks || "KYC Approved by Operations Admin";
      updates["kyc.documentStatus.aadhaar"] = "approved";
      updates["kyc.documentStatus.pan"] = "approved";
      updates["kyc.documentStatus.bank"] = "approved";
      updates["kyc.documentStatus.address"] = "approved";
      updates["kyc.documentStatus.professional"] = "approved";

      updates.status = "approved";
      updates.verificationStatus = "approved";
      updates.accountStatus = "active";
      updates.shiftStatus = "Available";
      updates.suspended = false;
      updates.rejectionReason = FieldValue.delete();
      updates["kyc.rejectionReason"] = FieldValue.delete();

      if (Array.isArray(body.services)) {
        updates.services = body.services;
      }
      if (Array.isArray(body.categoryIds) && body.categoryIds.length > 0) {
        updates.categoryIds = body.categoryIds;
        updates.categoryId = body.categoryId || body.categoryIds[0];
      } else if (body.categoryId) {
        updates.categoryId = body.categoryId;
        updates.categoryIds = [body.categoryId];
      }
      if (body.assignedServiceCategories && typeof body.assignedServiceCategories === "object") {
        updates.assignedServiceCategories = body.assignedServiceCategories;
      }
    } else if (decision === "reject") {
      updates["kyc.status"] = "rejected";
      updates["kyc.reviewedAt"] = nowIso;
      updates["kyc.reviewedBy"] = adminIdentifier;
      updates["kyc.rejectionReason"] = remarks;

      if (Object.keys(docStatuses).length > 0) {
        for (const [docKey, docVal] of Object.entries(docStatuses)) {
          updates[`kyc.documentStatus.${docKey}`] = docVal;
        }
      }

      updates.status = "rejected";
      updates.verificationStatus = "rejected";
      updates.accountStatus = "rejected";
      updates.rejectionReason = remarks;
    } else if (decision === "request_correction") {
      updates["kyc.status"] = "under_review";
      updates["kyc.reviewedAt"] = nowIso;
      updates["kyc.reviewedBy"] = adminIdentifier;
      updates["kyc.rejectionReason"] = remarks;

      if (Object.keys(docStatuses).length > 0) {
        for (const [docKey, docVal] of Object.entries(docStatuses)) {
          updates[`kyc.documentStatus.${docKey}`] = docVal;
        }
      }

      updates.status = "pending";
      updates.verificationStatus = "pending";
      updates.rejectionReason = remarks;
    } else if (decision === "suspend") {
      updates.suspended = true;
      updates.status = "suspended";
      updates.verificationStatus = "suspended";
      updates.accountStatus = "suspended";
      updates.suspensionReason = remarks || "Suspended by Admin";
    } else if (decision === "reactivate") {
      updates.suspended = false;
      updates.status = "approved";
      updates.verificationStatus = "approved";
      updates.accountStatus = "active";
      updates.suspensionReason = FieldValue.delete();
    }

    const auditEntry = {
      id: `audit_${Date.now()}`,
      action: decision,
      adminId: caller.uid,
      adminName: adminIdentifier,
      timestamp: nowIso,
      remarks,
      documentStatus: docStatuses,
    };

    updates.auditLog = FieldValue.arrayUnion(auditEntry);

    await partnerRef.update(updates);

    return jsonWithCors(req, {
      success: true,
      partnerId,
      decision,
      status: updates.status,
      timestamp: nowIso,
      message: `Partner KYC ${decision} action applied successfully.`,
    });
  } catch (err: unknown) {
    console.error("Admin verify KYC error:", err);
    return jsonWithCors(req, { error: publicErrorMessage(err, "Failed to apply KYC decision") }, { status: 500 });
  }
}
