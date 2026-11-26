"use client";

import React, { useCallback, useEffect, useRef } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
};

const OTP_LENGTH = 6;

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const lastCompletedCode = useRef<string>("");

  // Ensure digits array has length 6
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || "");

  // Auto-focus the first empty box or box 0 on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmptyIndex = digits.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[targetIndex]?.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When value changes externally (e.g. WebOTP), check if complete and trigger callback
  useEffect(() => {
    const cleanDigits = value.replace(/\D/g, "");
    if (cleanDigits.length === OTP_LENGTH && cleanDigits !== lastCompletedCode.current) {
      lastCompletedCode.current = cleanDigits;
      onComplete?.(cleanDigits);
    }
  }, [value, onComplete]);

  const updateOtp = useCallback(
    (newOtp: string, focusIndex?: number) => {
      const sanitized = newOtp.replace(/\D/g, "").slice(0, OTP_LENGTH);
      onChange(sanitized);

      if (focusIndex !== undefined) {
        const nextIndex = Math.min(Math.max(0, focusIndex), OTP_LENGTH - 1);
        inputRefs.current[nextIndex]?.focus();
      }

      if (sanitized.length === OTP_LENGTH && sanitized !== lastCompletedCode.current) {
        lastCompletedCode.current = sanitized;
        onComplete?.(sanitized);
      }
    },
    [onChange, onComplete],
  );

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/\D/g, "");

    // 1. Mobile keyboard autofill (e.g. iOS QuickType "From Messages" or Android autocomplete)
    // Often delivers all 6 digits into the focused input at once
    if (cleanVal.length > 1) {
      updateOtp(cleanVal, cleanVal.length >= OTP_LENGTH ? OTP_LENGTH - 1 : cleanVal.length);
      return;
    }

    // 2. Single digit typed
    const newDigits = [...digits];
    newDigits[index] = cleanVal.slice(-1); // Take the latest typed digit
    const joined = newDigits.join("");

    if (cleanVal) {
      // Advance to next box
      updateOtp(joined, index < OTP_LENGTH - 1 ? index + 1 : index);
    } else {
      updateOtp(joined, index);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];

      if (digits[index]) {
        // Clear current box
        newDigits[index] = "";
        lastCompletedCode.current = "";
        updateOtp(newDigits.join(""), index);
      } else if (index > 0) {
        // Move to previous box and clear it
        newDigits[index - 1] = "";
        lastCompletedCode.current = "";
        updateOtp(newDigits.join(""), index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Delete") {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[index] = "";
      lastCompletedCode.current = "";
      updateOtp(newDigits.join(""), index);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const cleanDigits = pastedData.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (cleanDigits) {
      updateOtp(cleanDigits, cleanDigits.length >= OTP_LENGTH ? OTP_LENGTH - 1 : cleanDigits.length);
    }
  };

  return (
    <div className="flex w-full items-center justify-between gap-1.5 sm:gap-2.5">
      {digits.map((digit, index) => {
        const isFilled = Boolean(digit);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={index === 0 ? OTP_LENGTH : 1}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleInputChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1} of 6`}
            className={`size-11 sm:size-13 text-center text-xl sm:text-2xl font-black rounded-xl border transition-all duration-150 outline-none select-none ${
              hasError
                ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                : isFilled
                  ? "border-[#C45508] bg-orange-50/20 text-slate-900 shadow-2xs"
                  : "border-gray-200 bg-white text-slate-900 hover:border-gray-300 focus:border-[#C45508] focus:ring-2 focus:ring-[#C45508]/20 focus:bg-white"
            } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : "cursor-text"}`}
          />
        );
      })}
    </div>
  );
}
