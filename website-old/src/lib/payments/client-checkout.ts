"use client";

import { getAuthClient } from "@/lib/firebase/auth";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type LaunchCheckoutParams = {
  bookingId: string;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
  onDismiss?: () => void;
};

export async function launchRazorpayCustomerCheckout(params: LaunchCheckoutParams): Promise<void> {
  const { bookingId, onSuccess, onError, onDismiss } = params;
  const auth = getAuthClient();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error("Sign in required to proceed with payment.");
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Could not load Razorpay payment gateway.");
  }

  const token = await user.getIdToken();
  const orderRes = await fetch("/api/payments/razorpay/create-order", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bookingId }),
  });

  const orderData = (await orderRes.json().catch(() => ({}))) as {
    orderId?: string;
    keyId?: string;
    amount?: number;
    error?: string;
  };

  if (!orderRes.ok || !orderData.orderId || !orderData.keyId) {
    throw new Error(orderData.error || "Failed to create payment order.");
  }

  const rzp = new window.Razorpay({
    key: orderData.keyId,
    amount: orderData.amount,
    currency: "INR",
    name: "Repair Series",
    description: `Booking #${bookingId.slice(0, 8)} Payment`,
    order_id: orderData.orderId,
    theme: { color: "#C45508" },
    handler: async (resp: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const verifyRes = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
          }),
        });

        const verifyData = (await verifyRes.json().catch(() => ({}))) as {
          error?: string;
          applied?: boolean;
        };

        if (!verifyRes.ok) {
          throw new Error(verifyData.error || "Payment verification failed.");
        }

        onSuccess?.();
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error("Payment verification failed"));
      }
    },
    modal: {
      ondismiss: () => {
        onDismiss?.();
      },
    },
  });

  rzp.open();
}
