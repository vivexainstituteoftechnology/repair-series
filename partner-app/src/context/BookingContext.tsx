import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";
import { BookingDoc, BookingLifecycleStatus, BookingStatus } from "../types/booking";
import { PartnerApi } from "../services/apiClient";

interface BookingContextType {
  bookings: BookingDoc[];
  activeJobs: BookingDoc[];
  newRequests: BookingDoc[];
  upcomingJobs: BookingDoc[];
  completedJobs: BookingDoc[];
  isLoading: boolean;
  acceptBooking: (bookingId: string) => Promise<boolean>;
  declineBooking: (bookingId: string, reason?: string) => Promise<boolean>;
  updateLifecycle: (bookingId: string, nextStatus: BookingLifecycleStatus) => Promise<boolean>;
  startJobWithOtp: (bookingId: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  collectCashPayment: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  getBookingById: (bookingId: string) => BookingDoc | undefined;
}

const BookingContext = createContext<BookingContextType>({} as BookingContextType);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { partnerDoc } = useAuth();
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!partnerDoc?.id) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    const partnerId = partnerDoc.id;
    const bookingsCol = collection(db, "bookings");

    // Primary query: bookings where technicianId matches partner UID
    const q1 = query(
      bookingsCol,
      where("technicianId", "==", partnerId),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q1,
      (snapshot) => {
        const rows: BookingDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          bookingId: d.id,
          ...d.data(),
        })) as BookingDoc[];
        setBookings(rows);
        setIsLoading(false);
      },
      (error) => {
        console.warn("Bookings listener error:", error);
        // Fallback without orderBy if Firestore index is pending
        const qFallback = query(
          bookingsCol,
          where("technicianId", "==", partnerId),
        );
        onSnapshot(qFallback, (snapFallback) => {
          const rows: BookingDoc[] = snapFallback.docs.map((d) => ({
            id: d.id,
            bookingId: d.id,
            ...d.data(),
          })) as BookingDoc[];
          setBookings(rows);
          setIsLoading(false);
        });
      },
    );

    return () => unsubscribe();
  }, [partnerDoc?.id]);

  // Derived categorized bookings
  const newRequests = bookings.filter((b) => {
    const assignSt = String(b.assignmentStatus || "").toUpperCase();
    const st = String(b.status || "").toLowerCase();
    return (
      (assignSt === "OFFERED" || assignSt === "SEARCHING") &&
      st !== "completed" &&
      st !== "cancelled"
    );
  });

  const activeJobs = bookings.filter((b) => {
    const st = String(b.status || "").toLowerCase();
    const assignSt = String(b.assignmentStatus || "").toUpperCase();
    return (
      (st === "assigned" || st === "inprogress" || st === "in progress") &&
      assignSt !== "OFFERED"
    );
  });

  const completedJobs = bookings.filter((b) => {
    const st = String(b.status || "").toLowerCase();
    return st === "completed";
  });

  const upcomingJobs = bookings.filter((b) => {
    const st = String(b.status || "").toLowerCase();
    if (st === "completed" || st === "cancelled") return false;
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());
    return b.scheduledDate && b.scheduledDate > today;
  });

  const acceptBooking = async (bookingId: string): Promise<boolean> => {
    try {
      // First attempt backend API call with verification
      try {
        await PartnerApi.respondAssignment(bookingId, "accept");
        return true;
      } catch (apiErr) {
        console.info("API respondAssignment failed, falling back to direct Firestore update:", apiErr);
      }

      // Direct Firestore fallback
      const ref = doc(db, "bookings", bookingId);
      await updateDoc(ref, {
        assignmentStatus: "ACCEPTED",
        lifecycleStatus: "PARTNER_ACCEPTED",
        status: "Assigned",
        assignmentRespondedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Failed to accept booking:", err);
      return false;
    }
  };

  const declineBooking = async (
    bookingId: string,
    reason?: string,
  ): Promise<boolean> => {
    try {
      try {
        await PartnerApi.respondAssignment(bookingId, "decline");
        return true;
      } catch (apiErr) {
        console.info("API decline failed, falling back to direct Firestore update:", apiErr);
      }

      const ref = doc(db, "bookings", bookingId);
      await updateDoc(ref, {
        assignmentStatus: "DECLINED",
        lifecycleStatus: "FINDING_PARTNER",
        declineReason: reason || "Partner unavailable",
        technicianId: null,
        technicianName: "",
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Failed to decline booking:", err);
      return false;
    }
  };

  const updateLifecycle = async (
    bookingId: string,
    nextStatus: BookingLifecycleStatus,
  ): Promise<boolean> => {
    try {
      const ref = doc(db, "bookings", bookingId);
      const patch: Record<string, any> = {
        lifecycleStatus: nextStatus,
        updatedAt: serverTimestamp(),
      };

      if (nextStatus === "PARTNER_ON_THE_WAY") {
        patch["onTheWayAt"] = serverTimestamp();
      } else if (nextStatus === "PARTNER_ARRIVED") {
        patch["arrivedAt"] = serverTimestamp();
      } else if (nextStatus === "WORK_COMPLETED") {
        patch["workCompletedAt"] = serverTimestamp();
      }

      await updateDoc(ref, patch);
      return true;
    } catch (err) {
      console.error(`Failed to update lifecycle to ${nextStatus}:`, err);
      return false;
    }
  };

  const startJobWithOtp = async (
    bookingId: string,
    otp: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      try {
        await PartnerApi.startJob(bookingId, otp);
        return { success: true };
      } catch (apiErr: any) {
        // If API returns INVALID_OTP error, surface it directly
        if (apiErr?.code === "INVALID_OTP" || apiErr?.message?.includes("Invalid OTP")) {
          return { success: false, error: "Incorrect 4-digit OTP. Please ask the customer for the code shown in their app." };
        }
        console.info("API start-job failed, falling back to Firestore validation:", apiErr);
      }

      // Client Firestore validation fallback
      const target = bookings.find((b) => b.id === bookingId);
      const cleanOtp = otp.replace(/\D/g, "").trim();

      if (target?.otp && target.otp.trim() !== cleanOtp) {
        return { success: false, error: "Incorrect 4-digit OTP. Please ask the customer for the code shown in their app." };
      }

      const ref = doc(db, "bookings", bookingId);
      await updateDoc(ref, {
        status: "InProgress",
        lifecycleStatus: "JOB_STARTED",
        otpVerifiedAt: serverTimestamp(),
        serviceStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to verify OTP." };
    }
  };

  const collectCashPayment = async (
    bookingId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      try {
        await PartnerApi.collectCash(bookingId);
        return { success: true };
      } catch (apiErr) {
        console.info("API collect-cash failed, falling back to direct Firestore update:", apiErr);
      }

      const ref = doc(db, "bookings", bookingId);
      await updateDoc(ref, {
        paymentStatus: "paid",
        paymentMethod: "CASH",
        status: "Completed",
        lifecycleStatus: "COMPLETED",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Cash collection failed." };
    }
  };

  const getBookingById = (bookingId: string) => {
    return bookings.find((b) => b.id === bookingId);
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        activeJobs,
        newRequests,
        upcomingJobs,
        completedJobs,
        isLoading,
        acceptBooking,
        declineBooking,
        updateLifecycle,
        startJobWithOtp,
        collectCashPayment,
        getBookingById,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => useContext(BookingContext);
