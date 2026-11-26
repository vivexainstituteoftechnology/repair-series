import React, { createContext, useContext, useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";
import { useBookings } from "./BookingContext";
import { WalletData, PayoutRequest, WalletLedgerEntry, TodaySettlement } from "../types/wallet";
import { PartnerApi } from "../services/apiClient";

interface WalletContextType {
  wallet: WalletData;
  isLoading: boolean;
  todayEarnings: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  requestPayout: (amountRupees: number) => Promise<{ success: boolean; error?: string }>;
  submitSettlementProof: (params: {
    amountPaise: number;
    paymentReference: string;
    proofUrl?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshWallet: () => Promise<void>;
}

const defaultWallet: WalletData = {
  balancePaise: 0,
  balanceRupees: 0,
  ledger: [],
  todaySettlement: null,
  payoutRequests: [],
};

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { partnerDoc } = useAuth();
  const { completedJobs } = useBookings();
  const [wallet, setWallet] = useState<WalletData>(defaultWallet);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWalletFromApi = async () => {
    if (!partnerDoc?.id) return;
    try {
      const data = await PartnerApi.getWallet();
      if (data?.ok) {
        setWallet((prev) => ({
          ...prev,
          balancePaise: Number(data.balancePaise) || 0,
          balanceRupees: Number(data.balanceRupees) || (Number(data.balancePaise) || 0) / 100,
          ledger: Array.isArray(data.ledger) ? data.ledger : prev.ledger,
          todaySettlement: data.todaySettlement || prev.todaySettlement,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch wallet from API:", err);
    }
  };

  useEffect(() => {
    if (!partnerDoc?.id) {
      setWallet(defaultWallet);
      setIsLoading(false);
      return;
    }

    const partnerId = partnerDoc.id;

    // 1. Listen to partnerWallets/{partnerId} in Firestore
    const walletRef = doc(db, "partnerWallets", partnerId);
    const unsubWallet = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const paise = Number(d.balancePaise) || 0;
        setWallet((prev) => ({
          ...prev,
          balancePaise: paise,
          balanceRupees: paise / 100,
        }));
      }
      setIsLoading(false);
    });

    // 2. Listen to payout requests subcollection
    const payoutsRef = collection(db, `technicians/${partnerId}/payoutRequests`);
    const qPayouts = query(payoutsRef, orderBy("createdAt", "desc"));
    const unsubPayouts = onSnapshot(
      qPayouts,
      (snap) => {
        const rows: PayoutRequest[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PayoutRequest[];
        setWallet((prev) => ({ ...prev, payoutRequests: rows }));
      },
      () => {},
    );

    // Initial API sync
    fetchWalletFromApi();

    return () => {
      unsubWallet();
      unsubPayouts();
    };
  }, [partnerDoc?.id]);

  // Earnings calculations from completed jobs
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const todayEarnings = completedJobs
    .filter((b) => {
      const d = b.scheduledDate || "";
      return d.startsWith(today);
    })
    .reduce((sum, b) => {
      const payout = Number(b.partnerPayout ?? b.technicianPayout ?? (Number(b.amount || 0) * 0.7));
      return sum + payout;
    }, 0);

  const thisWeekEarnings = completedJobs.reduce((sum, b) => {
    const payout = Number(b.partnerPayout ?? b.technicianPayout ?? (Number(b.amount || 0) * 0.7));
    return sum + payout;
  }, 0);

  const thisMonthEarnings = thisWeekEarnings; // Scaled to current cycle

  const requestPayout = async (
    amountRupees: number,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!partnerDoc?.id) return { success: false, error: "Not authenticated" };
    try {
      try {
        const res = await PartnerApi.requestPayout(amountRupees);
        if (res?.ok || res?.success) {
          await fetchWalletFromApi();
          return { success: true };
        }
      } catch (apiErr: any) {
        if (apiErr?.status === 400) {
          return { success: false, error: apiErr.message };
        }
      }

      // Firestore direct fallback
      const amountPaise = Math.round(amountRupees * 100);
      const ref = collection(db, `technicians/${partnerDoc.id}/payoutRequests`);
      await addDoc(ref, {
        amount: amountRupees,
        amountPaise,
        status: "PENDING",
        partnerId: partnerDoc.id,
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Payout request failed." };
    }
  };

  const submitSettlementProof = async (params: {
    amountPaise: number;
    paymentReference: string;
    proofUrl?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      await PartnerApi.submitSettlement({
        amountPaise: params.amountPaise,
        paymentReference: params.paymentReference,
        proofUrl: params.proofUrl,
      });
      await fetchWalletFromApi();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to submit remittance." };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isLoading,
        todayEarnings,
        thisWeekEarnings,
        thisMonthEarnings,
        requestPayout,
        submitSettlementProof,
        refreshWallet: fetchWalletFromApi,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
