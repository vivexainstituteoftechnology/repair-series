"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/context/cart-context";
import { CatalogProvider } from "@/context/catalog-context";
import { GuestBrowseProvider } from "@/context/guest-browse-context";
import { LocationProvider } from "@/context/location-context";
import { ServiceModalProvider } from "@/context/service-modal-context";
import { AppSettingsProvider } from "@/context/app-settings-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppSettingsProvider>
      <LocationProvider>
        <CatalogProvider>
          <CartProvider>
            <ServiceModalProvider>
              <GuestBrowseProvider>{children}</GuestBrowseProvider>
            </ServiceModalProvider>
          </CartProvider>
        </CatalogProvider>
      </LocationProvider>
    </AppSettingsProvider>
  );
}
