"use client";

import { Suspense } from "react";
import { CartCheckoutClient } from "./cart-checkout";
import { Container } from "@/components/container";

export default function CartCheckoutPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-16 text-center">
          <p className="text-sm text-neutral-500">Loading checkout...</p>
        </Container>
      }
    >
      <CartCheckoutClient />
    </Suspense>
  );
}
