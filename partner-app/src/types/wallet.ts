export interface WalletLedgerEntry {
  id: string;
  partnerId: string;
  type: "credit" | "debit" | string;
  amountPaise: number;
  amountRupees?: number;
  balanceAfterPaise?: number;
  reason?: string;
  bookingId?: string;
  createdAt?: string | { seconds: number; nanoseconds: number };
}

export interface TodaySettlement {
  id?: string;
  partnerId?: string;
  dateKey?: string;
  collectedCashPaise?: number;
  partnerPayoutPaise?: number;
  companySharePaise?: number;
  netRemittanceDuePaise?: number;
  status?: "PENDING" | "SUBMITTED" | "VERIFIED" | string;
  lastSubmissionId?: string;
  submissionStatus?: string;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  amountPaise?: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  walletBalancePaise?: number;
  createdAt?: string | { seconds: number; nanoseconds: number };
  processedAt?: string | { seconds: number; nanoseconds: number };
}

export interface WalletData {
  balancePaise: number;
  balanceRupees: number;
  ledger: WalletLedgerEntry[];
  todaySettlement: TodaySettlement | null;
  payoutRequests: PayoutRequest[];
}
