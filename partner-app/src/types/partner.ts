export type VerificationStatus = "active" | "approved" | "pending" | "under_review" | "rejected" | "suspended" | "incomplete";

export type ShiftStatus = "Available" | "Busy" | "Offline";

export interface KycDocumentStatus {
  aadhaar?: "pending" | "approved" | "rejected" | "correction_requested";
  pan?: "pending" | "approved" | "rejected" | "correction_requested";
  bank?: "pending" | "approved" | "rejected" | "correction_requested";
  address?: "pending" | "approved" | "rejected";
  professional?: "pending" | "approved" | "rejected";
}

export interface KycAuditLog {
  id: string;
  action: string;
  adminId?: string;
  adminName?: string;
  timestamp: string;
  remarks?: string;
  documentStatus?: KycDocumentStatus;
}

export interface PartnerDoc {
  id: string;
  name: string;
  phone: string;
  phoneNormalized?: string;
  email?: string;
  dob?: string;
  gender?: string;
  avatar?: string;
  profileImage?: string;
  status?: VerificationStatus | string;
  verificationStatus?: VerificationStatus;
  accountStatus?: string;
  shiftStatus?: ShiftStatus;
  isOnline?: boolean;
  categoryId?: string;
  categoryIds?: string[];
  assignedServiceCategories?: Record<string, string[]>;
  skills?: string | string[];
  areaAddress?: string;
  city?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  serviceRadius?: number | string;
  rating?: number;
  ratingCount?: number;
  completedBookings?: number;
  pendingBookings?: number;
  suspended?: boolean;
  suspensionReason?: string;
  rejectionReason?: string;
  address?: {
    houseNumber: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    fullAddress: string;
    latitude: number | null;
    longitude: number | null;
    formattedAddress?: string;
  };
  identity?: {
    aadhaarNumber: string;
    aadhaarFrontUrl: string;
    aadhaarBackUrl: string;
    panNumber: string;
    panCardUrl: string;
    submittedAt?: string;
  };
  bank?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    chequeOrPassbookUrl: string;
    upiId?: string;
  };
  professional?: {
    categoryId: string;
    categoryIds: string[];
    experienceYears: string;
    experienceDetails: string;
    skills: string;
    certificateUrls?: string[];
    workPhotoUrls?: string[];
  };
  kyc?: {
    status?: "pending" | "under_review" | "approved" | "rejected" | "incomplete";
    step?: number;
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    adminRemarks?: string;
    rejectionReason?: string;
    documentStatus?: KycDocumentStatus;
    declarationsAccepted?: boolean;
    termsAccepted?: boolean;
    consentAccepted?: boolean;
    personal?: {
      legalName: string;
      phone: string;
      email: string;
      dob: string;
      gender?: string;
      profileImageUrl: string;
    };
    address?: {
      houseNumber: string;
      street: string;
      city: string;
      state: string;
      pincode: string;
      fullAddress: string;
      latitude: number | null;
      longitude: number | null;
      formattedAddress?: string;
    };
    identity?: {
      aadhaarNumber: string;
      aadhaarFrontUrl: string;
      aadhaarBackUrl: string;
      panNumber: string;
      panCardUrl: string;
    };
    bank?: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      chequeOrPassbookUrl: string;
      upiId?: string;
    };
    professional?: {
      categoryId: string;
      categoryIds: string[];
      experienceYears: string;
      experienceDetails: string;
      skills: string;
      certificateUrls?: string[];
      workPhotoUrls?: string[];
    };
  };
  auditLog?: KycAuditLog[];
  fcmTokens?: string[];
  expoPushToken?: string;
  createdAt?: string | { seconds: number; nanoseconds: number };
  updatedAt?: string | { seconds: number; nanoseconds: number };
}

export interface PartnerStats {
  todayEarnings: number;
  todayCompletedCount: number;
  pendingJobsCount: number;
  upcomingJobsCount: number;
  overallRating: number;
  acceptanceRate: number;
}
