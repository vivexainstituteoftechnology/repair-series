export type BookingStatus =
  | "New"
  | "Assigned"
  | "InProgress"
  | "Completed"
  | "Cancelled";

export type BookingLifecycleStatus =
  | "BOOKING_CREATED"
  | "FINDING_PARTNER"
  | "PARTNER_ASSIGNED"
  | "PARTNER_ACCEPTED"
  | "PARTNER_ON_THE_WAY"
  | "PARTNER_ARRIVED"
  | "JOB_STARTED"
  | "DIAGNOSIS"
  | "ADDITIONAL_APPROVAL"
  | "WORK_IN_PROGRESS"
  | "WORK_COMPLETED"
  | "INVOICE_GENERATED"
  | "COMPLETED"
  | "RATED"
  | "CANCELLED";

export type AssignmentStatus =
  | "SEARCHING"
  | "OFFERED"
  | "ACCEPTED"
  | "DECLINED"
  | "UNRESPONDED";

export interface BookingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
}

export interface BookingServiceItem {
  serviceId?: string;
  serviceName?: string;
  variantId?: string;
  variantName?: string;
  price?: number;
  unitPrice?: number;
  quantity?: number;
  categoryId?: string;
  serviceCategoryId?: string;
}

export interface BookingDoc {
  id: string;
  bookingId?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string;
  address?: BookingAddress;
  serviceId?: string;
  serviceName?: string;
  serviceImage?: string;
  items?: BookingServiceItem[];
  addOnServices?: Array<{ title?: string; amount?: number; quantity?: number }>;
  additionalServices?: Array<{ title?: string; amount?: number; quantity?: number }>;
  status: BookingStatus;
  lifecycleStatus?: BookingLifecycleStatus | string;
  assignmentStatus?: AssignmentStatus | string;
  technicianId?: string;
  technicianName?: string;
  partnerAssignments?: Array<{
    partnerId?: string;
    status?: string;
    categoryId?: string;
  }>;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledSlot?: string;
  timeSlot?: string;
  otp?: string;
  otpVerifiedAt?: string | { seconds: number; nanoseconds: number };
  serviceStartedAt?: string | { seconds: number; nanoseconds: number };
  completedAt?: string | { seconds: number; nanoseconds: number };
  amount?: number;
  baseAmount?: number;
  customerTotal?: number;
  partnerPayout?: number;
  technicianPayout?: number;
  visitingCharge?: number;
  convenienceFee?: number;
  paymentStatus?: "pending" | "paid" | string;
  paymentMethod?: "CASH" | "ONLINE" | "COD" | string;
  distanceKm?: number;
  completionPhoto?: { url?: string };
  createdAt?: string | { seconds: number; nanoseconds: number };
  updatedAt?: string | { seconds: number; nanoseconds: number };
}
