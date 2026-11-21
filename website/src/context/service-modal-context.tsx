"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ServiceDoc } from "@/lib/booking/types";
import { getDb } from "@/lib/firebase/firestore";
import { loadService } from "@/lib/services/helpers";

type ServiceModalContextValue = {
  isOpen: boolean;
  service: ServiceDoc | null;
  loading: boolean;
  error: string | null;
  openServiceModal: (serviceOrId: ServiceDoc | string) => void;
  closeServiceModal: () => void;
};

const ServiceModalContext = createContext<ServiceModalContextValue | undefined>(undefined);

export function ServiceModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [service, setService] = useState<ServiceDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openServiceModal = useCallback(async (serviceOrId: ServiceDoc | string) => {
    setError(null);

    if (typeof serviceOrId === "object" && serviceOrId !== null) {
      // Immediately open with passed service so there is zero latency/blank flash
      setService(serviceOrId);
      setIsOpen(true);

      // Asynchronously fetch fresh data (variations, processSteps, keyPoints, brandImage) if needed
      const serviceId = serviceOrId.id || serviceOrId.slug;
      if (serviceId) {
        try {
          const db = getDb();
          if (db) {
            const fresh = await loadService(db, serviceId);
            if (fresh) {
              setService((prev) => {
                if (!prev) return fresh;
                const prevId = prev.id || prev.slug;
                const freshId = fresh.id || fresh.slug;
                return prevId === freshId ? { ...prev, ...fresh } : fresh;
              });
            }
          }
        } catch (err) {
          console.warn("Could not load extended service details for modal:", err);
        }
      }
    } else if (typeof serviceOrId === "string" && serviceOrId.trim()) {
      setIsOpen(true);
      setLoading(true);
      setService(null);
      try {
        const db = getDb();
        if (!db) throw new Error("Firebase database not configured.");
        const fresh = await loadService(db, serviceOrId);
        setService(fresh);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const closeServiceModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Automatically open modal if ?service=... query parameter is present in URL
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get("service");
    if (serviceParam) {
      openServiceModal(serviceParam);
    }
  }, [openServiceModal]);

  const value = useMemo(
    () => ({
      isOpen,
      service,
      loading,
      error,
      openServiceModal,
      closeServiceModal,
    }),
    [isOpen, service, loading, error, openServiceModal, closeServiceModal],
  );

  return (
    <ServiceModalContext.Provider value={value}>
      {children}
    </ServiceModalContext.Provider>
  );
}

export function useServiceModal() {
  const ctx = useContext(ServiceModalContext);
  if (!ctx) {
    throw new Error("useServiceModal must be used within a ServiceModalProvider");
  }
  return ctx;
}
