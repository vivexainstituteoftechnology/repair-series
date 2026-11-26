"use client";

import { useEffect } from "react";

type Props = {
  active: boolean;
  onVerifiedChange: (verified: boolean) => void;
  remountKey?: number;
};

export function PhoneRecaptchaBox({
  active,
  onVerifiedChange,
}: Props) {
  useEffect(() => {
    if (active) {
      onVerifiedChange(true);
    }
  }, [active, onVerifiedChange]);

  return null;
}
