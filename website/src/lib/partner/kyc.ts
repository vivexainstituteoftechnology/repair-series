export interface PartnerKycPersonal {
  legalName: string;
  phone: string;
  email: string;
  dob: string;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say" | string;
  profileImageUrl: string;
}

export interface PartnerKycAddress {
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  formattedAddress?: string;
}

export interface PartnerKycIdentity {
  aadhaarNumber: string;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string;
  panNumber: string;
  panCardUrl: string;
  submittedAt?: string;
}

export interface PartnerKycBank {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  chequeOrPassbookUrl: string;
  upiId?: string;
}

export interface PartnerKycProfessional {
  categoryId: string;
  categoryIds: string[];
  experienceYears: string;
  experienceDetails: string;
  skills: string;
  certificateUrls?: string[];
  workPhotoUrls?: string[];
}

export interface PartnerKycAuditEntry {
  id: string;
  action: "submitted" | "approved" | "rejected" | "correction_requested" | "suspended" | "reactivated";
  adminId?: string;
  adminName?: string;
  timestamp: string;
  remarks?: string;
  documentStatus?: Record<string, string>;
}

export interface PartnerKycData {
  personal: PartnerKycPersonal;
  address: PartnerKycAddress;
  identity: PartnerKycIdentity;
  bank: PartnerKycBank;
  professional: PartnerKycProfessional;
  status: "pending" | "under_review" | "approved" | "rejected" | "incomplete";
  step?: number;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  documentStatus?: {
    aadhaar?: "pending" | "approved" | "rejected" | "correction_requested";
    pan?: "pending" | "approved" | "rejected" | "correction_requested";
    bank?: "pending" | "approved" | "rejected" | "correction_requested";
    address?: "pending" | "approved" | "rejected";
    professional?: "pending" | "approved" | "rejected";
  };
  declarationsAccepted: boolean;
  termsAccepted: boolean;
  consentAccepted: boolean;
}

export function maskAadhaarNumber(value?: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length <= 4) return "•••• " + digits;
  return `XXXX XXXX ${digits.slice(-4)}`;
}

export function maskPanNumber(value?: string): string {
  const str = String(value || "").trim().toUpperCase();
  if (!str) return "—";
  if (str.length <= 4) return "••••";
  return `${str.slice(0, 2)}XXXXX${str.slice(-1)}`;
}

export function maskAccountNumber(value?: string): string {
  const s = String(value || "").replace(/\s/g, "");
  if (!s) return "—";
  if (s.length <= 4) return "••••";
  return `XXXXXX${s.slice(-4)}`;
}

/**
 * Strict server-side KYC validator. Every mandatory KYC detail must be present.
 */
export function validateKycSubmission(data: Partial<PartnerKycData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. Personal Details
  const p = data.personal;
  if (!p) {
    errors.push("Personal details are required.");
  } else {
    if (!p.legalName || p.legalName.trim().length < 2) {
      errors.push("Full legal name is required (minimum 2 characters).");
    }
    const cleanPhone = String(p.phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      errors.push("A valid 10-digit mobile number is required.");
    }
    if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) {
      errors.push("A valid email address is required.");
    }
    if (!p.dob || p.dob.trim().length < 4) {
      errors.push("Date of birth is required.");
    }
    if (!p.profileImageUrl || p.profileImageUrl.trim().length < 5) {
      errors.push("A profile photograph is required.");
    }
  }

  // 2. Address Details
  const a = data.address;
  if (!a) {
    errors.push("Address details are required.");
  } else {
    if (!a.houseNumber || a.houseNumber.trim().length < 1) {
      errors.push("House/Flat number is required.");
    }
    if (!a.street || a.street.trim().length < 2) {
      errors.push("Street/Area is required.");
    }
    if (!a.city || a.city.trim().length < 2) {
      errors.push("City is required.");
    }
    if (!a.state || a.state.trim().length < 2) {
      errors.push("State is required.");
    }
    const cleanPin = String(a.pincode || "").replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      errors.push("A valid 6-digit PIN code is required.");
    }
    if (a.latitude == null || a.longitude == null || !Number.isFinite(Number(a.latitude)) || !Number.isFinite(Number(a.longitude))) {
      errors.push("Google Maps location selection (latitude & longitude) is required.");
    }
  }

  // 3. Identity Details
  const idn = data.identity;
  if (!idn) {
    errors.push("Identity verification details are required.");
  } else {
    const cleanAadhaar = String(idn.aadhaarNumber || "").replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      errors.push("A valid 12-digit Aadhaar number is required.");
    }
    if (!idn.aadhaarFrontUrl || idn.aadhaarFrontUrl.trim().length < 5) {
      errors.push("Aadhaar front document is required.");
    }
    if (!idn.aadhaarBackUrl || idn.aadhaarBackUrl.trim().length < 5) {
      errors.push("Aadhaar back document is required.");
    }
    const cleanPan = String(idn.panNumber || "").trim().toUpperCase();
    if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      errors.push("A valid 10-character PAN number is required (e.g. ABCDE1234F).");
    }
    if (!idn.panCardUrl || idn.panCardUrl.trim().length < 5) {
      errors.push("PAN card document is required.");
    }
  }

  // 4. Bank Details
  const b = data.bank;
  if (!b) {
    errors.push("Bank details are required.");
  } else {
    if (!b.accountHolderName || b.accountHolderName.trim().length < 2) {
      errors.push("Bank account holder name is required.");
    }
    const cleanAcc = String(b.accountNumber || "").replace(/\s/g, "");
    if (cleanAcc.length < 8 || cleanAcc.length > 20) {
      errors.push("A valid bank account number is required (8-20 digits).");
    }
    const cleanIfsc = String(b.ifscCode || "").trim().toUpperCase();
    if (!cleanIfsc || cleanIfsc.length !== 11) {
      errors.push("A valid 11-character IFSC code is required.");
    }
    if (!b.bankName || b.bankName.trim().length < 2) {
      errors.push("Bank name is required.");
    }
    if (!b.chequeOrPassbookUrl || b.chequeOrPassbookUrl.trim().length < 5) {
      errors.push("Cancelled cheque or bank passbook document is required.");
    }
  }

  // 5. Professional Details
  const prof = data.professional;
  if (!prof) {
    errors.push("Professional details are required.");
  } else {
    if (!prof.categoryId && (!prof.categoryIds || prof.categoryIds.length === 0)) {
      errors.push("At least one service category must be selected.");
    }
    if (!prof.experienceYears || prof.experienceYears.trim().length < 1) {
      errors.push("Previous work experience is required.");
    }
    if (!prof.skills || prof.skills.trim().length < 2) {
      errors.push("Skills and specialization are required.");
    }
  }

  // 6. Mandatory Consents & Declarations
  if (!data.declarationsAccepted) {
    errors.push("Mandatory declaration of information accuracy must be accepted.");
  }
  if (!data.termsAccepted) {
    errors.push("Partner Terms & Conditions must be accepted.");
  }
  if (!data.consentAccepted) {
    errors.push("Consent for verification must be accepted.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
