"use client";

import {
  RecaptchaVerifier,
  signInWithCustomToken,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase/auth";
import { logPhoneOtpFailure, toPhoneAuthUserError } from "@/lib/auth/phone-errors";
import { parseIndiaMobile } from "@/lib/auth/phone";

export const PHONE_RECAPTCHA_ID = "rs-phone-recaptcha";

const OTP_SEND_TIMEOUT_MS = 60_000;

let verifier: RecaptchaVerifier | null = null;
let confirmation: ConfirmationResult | null = null;
let sendInFlight = false;

function requireBrowser() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Phone login is only available in the browser.");
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Creates a brand new, isolated DOM container for reCAPTCHA.
 * Removing the old element guarantees Google's recaptcha__en.js will NEVER
 * throw "reCAPTCHA has already been rendered in this element".
 */
function getFreshRecaptchaHost(): HTMLElement {
  requireBrowser();
  const existing = document.getElementById(PHONE_RECAPTCHA_ID);
  if (existing) {
    try {
      existing.remove();
    } catch {
      /* ignore */
    }
  }
  const host = document.createElement("div");
  host.id = PHONE_RECAPTCHA_ID;
  host.style.position = "fixed";
  host.style.bottom = "0";
  host.style.right = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.overflow = "hidden";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  return host;
}

export function isPhoneCaptchaVerified() {
  return true;
}

export function clearPhoneVerifier() {
  if (sendInFlight) return;
  if (verifier) {
    try {
      verifier.clear();
    } catch {
      /* ignore */
    }
    verifier = null;
  }
  const existing = document.getElementById(PHONE_RECAPTCHA_ID);
  if (existing) {
    try {
      existing.remove();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Gets or creates the invisible reCAPTCHA verifier with a clean DOM target.
 */
export function getOrCreatePhoneVerifier(auth: Auth, forceReset = false): RecaptchaVerifier {
  requireBrowser();

  if (verifier && !forceReset) {
    return verifier;
  }

  clearPhoneVerifier();
  const host = getFreshRecaptchaHost();

  const next = new RecaptchaVerifier(auth, host, {
    size: "invisible",
    callback: () => {
      // Invisible verification passed
    },
    "expired-callback": () => {
      clearPhoneVerifier();
    },
  });

  verifier = next;
  return next;
}

/** Legacy export kept for backward compatibility */
export async function mountVisiblePhoneRecaptcha(
  onVerifiedChange?: (verified: boolean) => void,
): Promise<void> {
  onVerifiedChange?.(true);
}

export async function sendCustomerOtp(rawPhone: string) {
  if (sendInFlight) {
    throw new Error("Sending OTP in progress. Please wait.");
  }
  const parsed = parseIndiaMobile(rawPhone);
  if (!parsed.ok) throw new Error(parsed.error);
  if (!parsed.e164.startsWith("+")) {
    throw new Error("Invalid phone number.");
  }

  const auth = getAuthClient();
  if (!auth) throw new Error("Firebase Auth is not configured.");

  // If user already has an active session for this phone, bypass
  if (auth.currentUser && auth.currentUser.phoneNumber === parsed.e164) {
    return { e164: parsed.e164, alreadySignedIn: true };
  }

  sendInFlight = true;
  let appVerifier: RecaptchaVerifier | null = null;

  try {
    // Always obtain a fresh, clean verifier with a brand new DOM container
    appVerifier = getOrCreatePhoneVerifier(auth, true);

    confirmation = await withTimeout(
      signInWithPhoneNumber(auth, parsed.e164, appVerifier),
      OTP_SEND_TIMEOUT_MS,
      "Unable to send OTP. Please check your connection and try again.",
    );

    return { e164: parsed.e164, alreadySignedIn: false };
  } catch (error) {
    logPhoneOtpFailure(error, {
      hasVerifier: Boolean(appVerifier),
      e164Length: parsed.e164.length,
      e164Prefix: parsed.e164.slice(0, 3),
      hostname: typeof window !== "undefined" ? window.location.hostname : "",
    });
    console.warn("[phone-auth] sendCustomerOtp failed:", error);
    confirmation = null;
    clearPhoneVerifier();
    throw toPhoneAuthUserError(error);
  } finally {
    sendInFlight = false;
  }
}

export async function confirmCustomerOtp(code: string) {
  const otp = String(code || "").replace(/\D/g, "");
  if (otp.length !== 6) throw new Error("Enter the 6-digit OTP.");
  if (!confirmation) throw new Error("Please request a new OTP first.");
  try {
    const cred = await confirmation.confirm(otp);
    return cred.user;
  } catch (error) {
    logPhoneOtpFailure(error, { stage: "confirm" });
    throw toPhoneAuthUserError(error);
  }
}

export async function resolveCustomerIdentity(displayName?: string) {
  const auth = getAuthClient();
  if (!auth?.currentUser) throw new Error("Sign in required");
  const token = await auth.currentUser.getIdToken();
  const res = await fetch("/api/auth/resolve-identity", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "customer", displayName: displayName || "" }),
  });
  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    customToken?: string;
    blocked?: boolean;
    created?: boolean;
    migrated?: boolean;
    uid?: string;
  };
  if (!res.ok) {
    await signOut(auth).catch(() => undefined);
    throw new Error(payload.error || "Could not complete sign in.");
  }
  if (payload.customToken) {
    await signInWithCustomToken(auth, payload.customToken);
  }
  return payload;
}
