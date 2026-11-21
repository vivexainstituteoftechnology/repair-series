export type ReviewStatus = "published" | "hidden";

export type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type ReviewDoc = {
  id: string; // Document ID is the bookingId
  reviewId: string; // Same as bookingId
  bookingId: string;
  customerId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  serviceId: string;
  serviceName?: string | null;
  serviceTypeId?: string | null;
  serviceTypeName?: string | null;
  rating: number; // 1 to 5
  comment?: string | null;
  isVerified: boolean; // true for genuine completed bookings
  status: ReviewStatus;
  createdAt: string | number | Date | unknown;
  updatedAt: string | number | Date | unknown;
};

export type ServiceRatingStats = {
  averageRating: number | null; // null when 0 reviews
  totalReviews: number;
  distribution: RatingDistribution;
  percentages: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

export type ReviewSubmissionInput = {
  bookingId: string;
  rating: number;
  comment?: string;
};
