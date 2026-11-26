"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthError,
  AuthField,
  AuthShell,
} from "@/components/auth/auth-shell";
import { PhoneRecaptchaBox } from "@/components/auth/phone-recaptcha";
import { OtpInput } from "@/components/auth/otp-input";
import {
  clearAuthReturnUrl,
  getAuthReturnUrl,
} from "@/lib/booking/draft";
import {
  OTP_LENGTH,
  formatNationalInput,
  parseIndiaMobile,
} from "@/lib/auth/phone";
import {
  clearPhoneVerifier,
  confirmCustomerOtp,
  resolveCustomerIdentity,
  sendCustomerOtp,
} from "@/lib/firebase/auth-phone";
import { getDb } from "@/lib/firebase/firestore";
import { BlockedAccountError } from "@/lib/firebase/auth-actions";
import { getCustomerProfile, isCustomerBlocked } from "@/lib/firebase/customer";
import { getAuthClient } from "@/lib/firebase/auth";

type Step = "phone" | "otp";

const RESEND_COOLDOWN_SECONDS = 30;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useMemo(() => getDb(), []);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [created, setCreated] = useState(false);
  const [onLocalhost, setOnLocalhost] = useState(false);
  const [loopbackAuthUrl, setLoopbackAuthUrl] = useState("http://127.0.0.1:3000/auth");
  const [captchaMountKey, setCaptchaMountKey] = useState(0);

  const verificationInFlightRef = useRef(false);

  const returnUrl =
    searchParams.get("return") || getAuthReturnUrl() || "/dashboard/bookings";

  // Check localhost environment for helpful Firebase guidance
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    setOnLocalhost(host === "localhost");
    const port = window.location.port ? `:${window.location.port}` : "";
    setLoopbackAuthUrl(
      `http://127.0.0.1${port}${window.location.pathname}${window.location.search}`,
    );
  }, []);

  // Cleanup verifier on unmount
  useEffect(() => {
    return () => {
      clearPhoneVerifier();
    };
  }, []);

  // If already logged in, redirect immediately without showing OTP or CAPTCHA
  useEffect(() => {
    const auth = getAuthClient();
    if (!auth) return undefined;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && step === "phone") {
        router.replace(returnUrl);
      }
    });
    return () => unsub();
  }, [returnUrl, router, step]);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const finishLogin = async () => {
    if (!db) throw new Error("Firebase is not configured.");
    const resolved = await resolveCustomerIdentity(name);
    const auth = getAuthClient();
    const uid = auth?.currentUser?.uid;
    if (uid) {
      const customer = await getCustomerProfile(db, uid);
      if (isCustomerBlocked(customer)) {
        await signOut(auth!).catch(() => undefined);
        throw new BlockedAccountError();
      }
    }
    setCreated(Boolean(resolved.created));
    clearAuthReturnUrl();
    router.replace(returnUrl);
  };

  // Perform OTP confirmation with duplicate prevention
  const executeVerify = useCallback(
    async (codeToVerify: string) => {
      const clean = codeToVerify.replace(/\D/g, "");
      if (clean.length !== OTP_LENGTH) {
        setError("Enter the 6-digit OTP.");
        return;
      }
      if (verificationInFlightRef.current) return;
      verificationInFlightRef.current = true;
      setVerifying(true);
      setError(null);

      try {
        await confirmCustomerOtp(clean);
        await finishLogin();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Invalid OTP. Please check the code and try again.",
        );
        verificationInFlightRef.current = false;
        setVerifying(false);
      }
    },
    [finishLogin], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Automatic WebOTP API Listener (Android Chrome & modern browsers)
  useEffect(() => {
    if (step !== "otp") return undefined;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return undefined;

    const ac = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      } as any)
      .then((content: any) => {
        if (content && typeof content.code === "string") {
          const detected = content.code.replace(/\D/g, "").slice(0, OTP_LENGTH);
          if (detected.length === OTP_LENGTH) {
            setOtp(detected);
            setInfoMessage("OTP detected automatically.");
            void executeVerify(detected);
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.debug("[web-otp] listener notice:", err);
        }
      });

    return () => {
      ac.abort();
    };
  }, [step, executeVerify]);

  const onSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setInfoMessage(null);

    const parsed = parseIndiaMobile(phone);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setLoading(true);
    try {
      const res = await sendCustomerOtp(parsed.national);
      if (res.alreadySignedIn) {
        // User already has an active session for this phone number
        await finishLogin();
        return;
      }
      setStep("otp");
      setOtp("");
      verificationInFlightRef.current = false;
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setInfoMessage(`OTP sent to +91 ${formatNationalInput(phone)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send OTP. Please check your network and try again.",
      );
      setCaptchaMountKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    if (cooldown > 0 || loading || verifying) return;
    setError(null);
    setInfoMessage(null);
    const parsed = parseIndiaMobile(phone);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setLoading(true);
    try {
      await sendCustomerOtp(parsed.national);
      setOtp("");
      verificationInFlightRef.current = false;
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setInfoMessage(`New OTP sent to +91 ${formatNationalInput(phone)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend OTP. Please wait a moment and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeVerify(otp);
  };

  const isPhoneValid = phone.replace(/\D/g, "").length === 10;
  const isOtpComplete = otp.replace(/\D/g, "").length === OTP_LENGTH;

  return (
    <AuthShell
      title={step === "phone" ? "Sign in" : "Enter Verification Code"}
      subtitle={
        step === "phone"
          ? "Enter your 10-digit mobile number. We'll send an OTP to verify."
          : `We sent a 6-digit verification code to +91 ${formatNationalInput(phone)}`
      }
    >
      {error ? <AuthError message={error} /> : null}

      {infoMessage ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{infoMessage}</span>
        </div>
      ) : null}

      {onLocalhost ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed">
          Firebase blocks real SMS OTP on <span className="font-bold">localhost</span>.
          For testing with real Indian numbers, access via{" "}
          <a className="font-bold underline" href={loopbackAuthUrl}>
            {loopbackAuthUrl}
          </a>{" "}
          (add <span className="font-semibold">127.0.0.1</span> to Firebase Authorized domains). Test phone numbers work on both.
        </div>
      ) : null}

      {step === "phone" ? (
        <form onSubmit={onSendOtp} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#0a0f1c]">
              Mobile number
            </label>
            <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-all focus-within:border-[#C45508] focus-within:ring-2 focus-within:ring-[#C45508]/20">
              <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3.5 text-sm font-bold text-[#0a0f1c] select-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                disabled={loading}
                onChange={(ev) => setPhone(formatNationalInput(ev.target.value))}
                placeholder="98765 43210"
                className="h-12 flex-1 px-3 text-base font-semibold tracking-wide text-slate-900 placeholder:text-gray-400 outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500 font-medium">
              We&apos;ll auto-verify your OTP via SMS.
            </p>
          </div>

          <AuthField
            label="Your name (new customers)"
            value={name}
            onChange={setName}
            placeholder="e.g. Rahul Sharma"
            autoComplete="name"
            disabled={loading}
          />

          {/* Invisible background reCAPTCHA — no repetitive visible checkbox */}
          <PhoneRecaptchaBox
            active
            remountKey={captchaMountKey}
            onVerifiedChange={() => {}}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full font-bold cursor-pointer transition-all active:scale-98"
            disabled={loading || !isPhoneValid}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Sending OTP...</span>
              </span>
            ) : (
              "Get OTP"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerifySubmit} className="mt-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[#0a0f1c]">
                Verification code (OTP)
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                  setInfoMessage(null);
                  // Preserve entered mobile number for quick editing
                }}
                className="text-xs font-bold text-[#C86A37] hover:underline"
              >
                Change number
              </button>
            </div>

            {/* 6-box Segmented OTP Input with auto-focus, paste & WebOTP auto-submit */}
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (error) setError(null);
              }}
              onComplete={(code) => {
                void executeVerify(code);
              }}
              disabled={loading || verifying}
              hasError={Boolean(error)}
              autoFocus
            />

            <p className="mt-2 text-center text-xs text-gray-500 font-medium">
              Auto-fills on supported Android &amp; iOS devices.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full font-bold cursor-pointer transition-all active:scale-98"
            disabled={loading || verifying || !isOtpComplete}
          >
            {verifying ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Verifying code...</span>
              </span>
            ) : (
              "Verify & Proceed"
            )}
          </Button>

          <div className="flex items-center justify-between pt-1 text-sm border-t border-gray-100">
            <span className="text-xs text-slate-500 font-medium">
              Didn&apos;t receive code?
            </span>

            <button
              type="button"
              disabled={loading || verifying || cooldown > 0}
              onClick={onResendOtp}
              className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
                cooldown > 0
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-[#C86A37] hover:text-[#A85028] cursor-pointer"
              }`}
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
              <span>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </span>
            </button>
          </div>
        </form>
      )}

      {created ? (
        <p className="mt-4 text-center text-xs text-emerald-700 font-medium">
          Customer account initialized successfully.
        </p>
      ) : null}

      <p className="mt-6 text-center text-xs text-[#64748b]">
        By signing in, you agree to RepairSeries Terms of Service and Privacy Policy.
      </p>
    </AuthShell>
  );
}
