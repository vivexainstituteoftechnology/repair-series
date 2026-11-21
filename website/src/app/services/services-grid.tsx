"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { UrbanServiceCard } from "@/components/services/urban-service-card";
import { isComingSoonService } from "@/lib/catalog/slug";
import { getDb } from "@/lib/firebase/firestore";
import type { ServiceDoc } from "@/lib/booking/types";
import { AlertCircle } from "lucide-react";

export function ServicesGrid() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceDoc[]>([]);

  const servicesCol = useMemo(() => {
    const db = getDb();
    return db ? collection(db, "services") : null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (mounted) {
        setLoading(true);
        setError(null);
      }

      try {
        if (!servicesCol) {
          throw new Error(
            "Firebase is not configured. Create `.env.local` with NEXT_PUBLIC_FIREBASE_* values."
          );
        }
        const q = query(servicesCol, orderBy("name", "asc"));
        const snap = await getDocs(q);
        const rows: ServiceDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        }));

        if (!mounted) return;
        setServices(rows);
      } catch (e) {
        if (!mounted) return;
        setError(
          e instanceof Error ? e.message : "Failed to load services from Firestore"
        );
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [servicesCol]);

  // Premium Error State
  if (error) {
    return (
      <div className="mt-8 flex items-start gap-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-900 shadow-sm">
        <AlertCircle className="mt-0.5 size-6 shrink-0 text-red-500" />
        <div>
          <h3 className="text-base font-bold">Couldn’t load services</h3>
          <p className="mt-1 text-sm leading-relaxed text-red-700/90">{error}</p>
          <p className="mt-3 text-xs font-medium text-red-600/70">
            Ensure Firebase web config exists in `.env.local` and Firestore rules allow reading `services`.
          </p>
        </div>
      </div>
    );
  }

  // Premium Loading Skeletons
  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div key={idx} className="flex flex-col animate-pulse">
            <div className="aspect-square w-full rounded-2xl bg-slate-200" />
            <div className="pt-2.5 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
              <div className="h-4 w-1/3 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No Services Found State
  if (!loading && services.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
        <h3 className="text-lg font-bold text-[#0a0f1c]">No Services Found</h3>
        <p className="mt-1 text-sm text-[#64748b]">Check back later for newly added services.</p>
      </div>
    );
  }

  // Beautiful Service Grid matching Urban Company
  return (
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {services.map((s) => (
        <UrbanServiceCard
          key={s.id}
          service={s}
          badge={isComingSoonService(s) ? "Coming Soon" : null}
          widthClass="w-full"
        />
      ))}
    </div>
  );
}