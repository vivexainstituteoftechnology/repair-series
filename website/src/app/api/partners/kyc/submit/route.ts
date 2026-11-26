import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { apiOptions, jsonWithCors, publicErrorMessage } from "@/lib/server/http";
import { requireApiCaller } from "@/lib/server/auth";
import {
  PartnerKycData,
  validateKycSubmission,
} from "@/lib/partner/kyc";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return apiOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const caller = await requireApiCaller(req).catch(() => null);
    const body = (await req.json().catch(() => ({}))) as Partial<PartnerKycData> & {
      partnerId?: string;
      action?: "submit" | "save-draft";
    };

    const partnerId = String(caller?.uid || body.partnerId || "").trim();
    if (!partnerId) {
      return jsonWithCors(req, { error: "Partner ID is required." }, { status: 401 });
    }

    const action = body.action || "submit";

    // If final submission, strictly validate every mandatory KYC requirement
    if (action === "submit") {
      const validation = validateKycSubmission(body);
      if (!validation.isValid) {
        return jsonWithCors(
          req,
          {
            error: "Mandatory KYC details missing or invalid.",
            errors: validation.errors,
          },
          { status: 400 },
        );
      }
    }

    const db = getAdminDb();
    const partnerRef = db.doc(`technicians/${partnerId}`);
    const existingSnap = await partnerRef.get();
    const existingData = (existingSnap.data() || {}) as Record<string, unknown>;

    const nowIso = new Date().toISOString();
    const cleanPhone = String(body.personal?.phone || existingData.phone || "").replace(/\D/g, "").slice(-10);
    const e164Phone = cleanPhone ? `+91${cleanPhone}` : "";

    // Assemble the complete partner document payload
    const kycStatus = action === "submit" ? "pending" : "incomplete";
    const statusVal = action === "submit" ? "pending" : (existingData.status || "pending");

    const kycPayload = {
      personal: {
        legalName: String(body.personal?.legalName || existingData.name || "").trim(),
        phone: e164Phone || String(existingData.phone || ""),
        email: String(body.personal?.email || existingData.email || "").trim(),
        dob: String(body.personal?.dob || "").trim(),
        gender: body.personal?.gender || "Prefer not to say",
        profileImageUrl: body.personal?.profileImageUrl || (existingData.profileImage as string) || "",
      },
      address: {
        houseNumber: String(body.address?.houseNumber || "").trim(),
        street: String(body.address?.street || "").trim(),
        city: String(body.address?.city || existingData.city || "Gurugram").trim(),
        state: String(body.address?.state || "Haryana").trim(),
        pincode: String(body.address?.pincode || "").trim(),
        fullAddress: String(body.address?.fullAddress || "").trim(),
        latitude: body.address?.latitude != null ? Number(body.address.latitude) : null,
        longitude: body.address?.longitude != null ? Number(body.address.longitude) : null,
        formattedAddress: String(body.address?.formattedAddress || "").trim(),
      },
      identity: {
        aadhaarNumber: String(body.identity?.aadhaarNumber || "").replace(/\D/g, ""),
        aadhaarFrontUrl: String(body.identity?.aadhaarFrontUrl || "").trim(),
        aadhaarBackUrl: String(body.identity?.aadhaarBackUrl || "").trim(),
        panNumber: String(body.identity?.panNumber || "").trim().toUpperCase(),
        panCardUrl: String(body.identity?.panCardUrl || "").trim(),
        submittedAt: nowIso,
      },
      bank: {
        accountHolderName: String(body.bank?.accountHolderName || "").trim(),
        accountNumber: String(body.bank?.accountNumber || "").replace(/\s/g, ""),
        ifscCode: String(body.bank?.ifscCode || "").trim().toUpperCase(),
        bankName: String(body.bank?.bankName || "").trim(),
        chequeOrPassbookUrl: String(body.bank?.chequeOrPassbookUrl || "").trim(),
        upiId: String(body.bank?.upiId || "").trim(),
      },
      professional: {
        categoryId: String(body.professional?.categoryId || existingData.categoryId || "").trim(),
        categoryIds: Array.isArray(body.professional?.categoryIds) && body.professional.categoryIds.length > 0
          ? body.professional.categoryIds
          : [String(body.professional?.categoryId || existingData.categoryId || "")].filter(Boolean),
        experienceYears: String(body.professional?.experienceYears || "").trim(),
        experienceDetails: String(body.professional?.experienceDetails || "").trim(),
        skills: String(body.professional?.skills || existingData.skills || "").trim(),
        certificateUrls: Array.isArray(body.professional?.certificateUrls) ? body.professional.certificateUrls : [],
        workPhotoUrls: Array.isArray(body.professional?.workPhotoUrls) ? body.professional.workPhotoUrls : [],
      },
      status: kycStatus,
      step: body.step || (action === "submit" ? 6 : 1),
      submittedAt: action === "submit" ? nowIso : existingData.submittedAt,
      declarationsAccepted: Boolean(body.declarationsAccepted),
      termsAccepted: Boolean(body.termsAccepted),
      consentAccepted: Boolean(body.consentAccepted),
      documentStatus: {
        aadhaar: "pending",
        pan: "pending",
        bank: "pending",
        address: "pending",
        professional: "pending",
      },
    };

    const rootUpdates: Record<string, unknown> = {
      name: kycPayload.personal.legalName,
      phone: kycPayload.personal.phone,
      phoneNormalized: kycPayload.personal.phone,
      email: kycPayload.personal.email,
      profileImage: kycPayload.personal.profileImageUrl,
      avatar: kycPayload.personal.profileImageUrl,
      city: kycPayload.address.city,
      areaAddress: kycPayload.address.fullAddress || `${kycPayload.address.houseNumber}, ${kycPayload.address.street}`,
      latitude: kycPayload.address.latitude,
      longitude: kycPayload.address.longitude,
      serviceRadius: existingData.serviceRadius || 15,
      categoryId: kycPayload.professional.categoryId,
      categoryIds: kycPayload.professional.categoryIds,
      skills: kycPayload.professional.skills,
      kyc: kycPayload,
      status: statusVal,
      verificationStatus: statusVal,
      shiftStatus: existingData.shiftStatus || "Offline",
      isOnline: existingData.isOnline || false,
      suspended: existingData.suspended || false,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (action === "submit") {
      const auditEntry = {
        id: `audit_${Date.now()}`,
        action: "submitted",
        timestamp: nowIso,
        remarks: "Mandatory KYC onboarding submitted by Partner",
      };
      rootUpdates.auditLog = FieldValue.arrayUnion(auditEntry);
    }

    if (!existingSnap.exists) {
      rootUpdates.createdAt = FieldValue.serverTimestamp();
      rootUpdates.completedBookings = 0;
      rootUpdates.pendingBookings = 0;
      rootUpdates.rating = 5.0;
      rootUpdates.ratingCount = 0;
    }

    await partnerRef.set(rootUpdates, { merge: true });

    // Sync subdocuments for legacy queries (bankDetails, aadhaar)
    try {
      const bankSubRef = db.doc(`technicians/${partnerId}/kyc/bankDetails`);
      await bankSubRef.set(
        {
          accountHolderName: kycPayload.bank.accountHolderName,
          accountNumber: kycPayload.bank.accountNumber,
          bankName: kycPayload.bank.bankName,
          ifscCode: kycPayload.bank.ifscCode,
          upiId: kycPayload.bank.upiId,
          chequeOrPassbookUrl: kycPayload.bank.chequeOrPassbookUrl,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const aadhaarSubRef = db.doc(`technicians/${partnerId}/kyc/aadhaar`);
      await aadhaarSubRef.set(
        {
          aadhaarNumber: kycPayload.identity.aadhaarNumber,
          frontUrl: kycPayload.identity.aadhaarFrontUrl,
          backUrl: kycPayload.identity.aadhaarBackUrl,
          panNumber: kycPayload.identity.panNumber,
          panCardUrl: kycPayload.identity.panCardUrl,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (subErr) {
      console.warn("Subdocument sync non-fatal error:", subErr);
    }

    return jsonWithCors(req, {
      success: true,
      partnerId,
      status: kycStatus,
      step: kycPayload.step,
      message:
        action === "submit"
          ? "KYC successfully submitted for Admin verification."
          : "KYC draft progress saved.",
    });
  } catch (err: unknown) {
    console.error("KYC submit error:", err);
    return jsonWithCors(req, { error: publicErrorMessage(err, "Failed to submit KYC application") }, { status: 500 });
  }
}
