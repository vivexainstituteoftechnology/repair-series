import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithCustomToken,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { PartnerDoc, ShiftStatus, VerificationStatus } from "../types/partner";
import { PartnerApi } from "../services/apiClient";
import { registerForPushNotificationsAsync } from "../services/notificationService";
import { getCurrentLocation, updatePartnerLocationInDb } from "../services/locationService";

const STORAGE_PARTNER_KEY = "rs_partner_profile";

interface AuthContextType {
  user: User | null;
  partnerDoc: PartnerDoc | null;
  isLoading: boolean;
  isOnline: boolean;
  verificationStatus: VerificationStatus;
  authError: string | null;
  toggleOnlineStatus: () => Promise<boolean>;
  setShiftStatus: (status: ShiftStatus) => Promise<boolean>;
  loginWithCustomToken: (token: string) => Promise<void>;
  devLoginWithPhone: (phone: string) => Promise<boolean>;
  registerPartnerProfile: (profile: Partial<PartnerDoc>) => Promise<boolean>;
  updatePartnerProfile: (patch: Partial<PartnerDoc>) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshPartnerDoc: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [partnerDoc, setPartnerDoc] = useState<PartnerDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore cached profile on startup for instant UI responsiveness
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_PARTNER_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setPartnerDoc(parsed);
        }
      } catch {}
    })();
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setPartnerDoc(null);
        await AsyncStorage.removeItem(STORAGE_PARTNER_KEY);
        setIsLoading(false);
        return;
      }

      // If user exists, subscribe to their Firestore technician document in real time
      const partnerRef = doc(db, "technicians", currentUser.uid);
      const unsubscribeDoc = onSnapshot(
        partnerRef,
        async (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as PartnerDoc;
            setPartnerDoc(data);
            await AsyncStorage.setItem(
              STORAGE_PARTNER_KEY,
              JSON.stringify(data),
            );

            // Register push notifications
            registerForPushNotificationsAsync(currentUser.uid);

            // Sync current location once if available
            getCurrentLocation().then((coords) => {
              if (coords) updatePartnerLocationInDb(currentUser.uid, coords);
            });
          } else {
            // User signed in but has no technician doc yet (new applicant)
            setPartnerDoc(null);
          }
          setIsLoading(false);
        },
        (error) => {
          console.warn("Firestore partner doc listener error:", error);
          setIsLoading(false);
        },
      );

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, []);

  const isOnline = (() => {
    if (!partnerDoc) return false;
    if (partnerDoc.shiftStatus === "Available" || partnerDoc.isOnline === true) {
      return true;
    }
    return false;
  })();

  const verificationStatus: VerificationStatus = (() => {
    if (!partnerDoc) return "pending";
    if (partnerDoc.suspended === true) return "suspended";
    const v = String(
      partnerDoc.verificationStatus || partnerDoc.status || "active",
    ).toLowerCase();
    if (v === "pending" || v === "rejected" || v === "suspended") {
      return v as VerificationStatus;
    }
    return "active";
  })();

  const toggleOnlineStatus = async (): Promise<boolean> => {
    if (!user || !partnerDoc) return false;
    const nextShift: ShiftStatus = isOnline ? "Offline" : "Available";
    const nextOnline = !isOnline;

    try {
      const partnerRef = doc(db, "technicians", user.uid);
      await updateDoc(partnerRef, {
        shiftStatus: nextShift,
        isOnline: nextOnline,
        updatedAt: serverTimestamp(),
      });

      // Update location if going online
      if (nextOnline) {
        const coords = await getCurrentLocation();
        if (coords) {
          await updatePartnerLocationInDb(user.uid, coords);
        }
      }

      return true;
    } catch (err) {
      console.error("Failed to toggle online status:", err);
      return false;
    }
  };

  const setShiftStatus = async (status: ShiftStatus): Promise<boolean> => {
    if (!user || !partnerDoc) return false;
    try {
      const partnerRef = doc(db, "technicians", user.uid);
      await updateDoc(partnerRef, {
        shiftStatus: status,
        isOnline: status === "Available",
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Failed to set shift status:", err);
      return false;
    }
  };

  const loginWithCustomToken = async (customToken: string): Promise<void> => {
    setAuthError(null);
    try {
      await signInWithCustomToken(auth, customToken);
    } catch (err: any) {
      setAuthError(err?.message || "Failed to sign in with token.");
      throw err;
    }
  };

  /**
   * Fast phone sign-in helper:
   * Looks up the technician record by phone number in Firestore,
   * resolves partner identity via the backend API, or binds the partner document.
   */
  const devLoginWithPhone = async (phone: string): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    const cleanPhone = phone.replace(/\D/g, "");
    const formatted10 = cleanPhone.slice(-10);

    try {
      // Find technician with matching phone
      const techCol = collection(db, "technicians");
      const snap = await getDocs(
        query(techCol, where("phone", ">=", formatted10)),
      );

      let matchedDoc: PartnerDoc | null = null;
      for (const d of snap.docs) {
        const p = String(d.data()?.phone || "").replace(/\D/g, "");
        if (p.endsWith(formatted10)) {
          matchedDoc = { id: d.id, ...d.data() } as PartnerDoc;
          break;
        }
      }

      if (!matchedDoc) {
        // Search by phoneNormalized or fallback
        const snap2 = await getDocs(techCol);
        for (const d of snap2.docs) {
          const p = String(d.data()?.phone || "").replace(/\D/g, "");
          if (p.includes(formatted10)) {
            matchedDoc = { id: d.id, ...d.data() } as PartnerDoc;
            break;
          }
        }
      }

      if (matchedDoc) {
        setPartnerDoc(matchedDoc);
        await AsyncStorage.setItem(
          STORAGE_PARTNER_KEY,
          JSON.stringify(matchedDoc),
        );
        setIsLoading(false);
        return true;
      }

      throw new Error(`No partner account found for +91 ${formatted10}. Please register first.`);
    } catch (err: any) {
      setAuthError(err?.message || "Partner sign in failed.");
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Registers a new partner profile and submits it for Admin Panel approval.
   */
  const registerPartnerProfile = async (
    profile: Partial<PartnerDoc>,
  ): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const uid = user?.uid || `partner_${Date.now()}`;
      const cleanPhone = String(profile.phone || "").replace(/\D/g, "").slice(-10);
      const e164 = `+91${cleanPhone}`;

      const newPartner: PartnerDoc = {
        id: uid,
        name: String(profile.name || "").trim() || "New Partner",
        phone: e164,
        phoneNormalized: e164,
        email: String(profile.email || "").trim(),
        status: "pending",
        verificationStatus: "pending",
        shiftStatus: "Offline",
        isOnline: false,
        categoryId: profile.categoryId || "",
        categoryIds: profile.categoryIds || (profile.categoryId ? [profile.categoryId] : []),
        skills: profile.skills || "",
        areaAddress: profile.areaAddress || "",
        city: profile.city || "Gurugram",
        serviceRadius: 10,
        completedBookings: 0,
        pendingBookings: 0,
        rating: 5.0,
        ratingCount: 0,
        suspended: false,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      const ref = doc(db, "technicians", uid);
      await setDoc(ref, newPartner, { merge: true });

      setPartnerDoc(newPartner);
      await AsyncStorage.setItem(
        STORAGE_PARTNER_KEY,
        JSON.stringify(newPartner),
      );
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setAuthError(err?.message || "Failed to register partner profile.");
      setIsLoading(false);
      return false;
    }
  };

  const updatePartnerProfile = async (
    patch: Partial<PartnerDoc>,
  ): Promise<boolean> => {
    if (!partnerDoc) return false;
    try {
      const ref = doc(db, "technicians", partnerDoc.id);
      await updateDoc(ref, {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Failed to update profile:", err);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (partnerDoc && isOnline) {
        // Automatically switch to Offline on logout to avoid phantom assignments
        await setShiftStatus("Offline");
      }
      await signOut(auth).catch(() => {});
      await AsyncStorage.removeItem(STORAGE_PARTNER_KEY);
      setUser(null);
      setPartnerDoc(null);
    } catch (err) {
      console.warn("Logout error:", err);
    }
  };

  const refreshPartnerDoc = () => {
    if (!partnerDoc?.id) return;
    const partnerRef = doc(db, "technicians", partnerDoc.id);
    onSnapshot(partnerRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as PartnerDoc;
        setPartnerDoc(data);
        AsyncStorage.setItem(STORAGE_PARTNER_KEY, JSON.stringify(data));
      }
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        partnerDoc,
        isLoading,
        isOnline,
        verificationStatus,
        authError,
        toggleOnlineStatus,
        setShiftStatus,
        loginWithCustomToken,
        devLoginWithPhone,
        registerPartnerProfile,
        updatePartnerProfile,
        logout,
        refreshPartnerDoc,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
