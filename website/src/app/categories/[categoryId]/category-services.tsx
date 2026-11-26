"use client";

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UrbanServiceCard } from "@/components/services/urban-service-card";
import { SkeletonServiceCard } from "@/components/ui/skeleton";
import { getDb } from "@/lib/firebase/firestore";
import type { ServiceDoc } from "@/lib/booking/types";
import { AlertCircle, ArrowRight, SearchX } from "lucide-react";

async function fetchServicesForCategory(categoryId: string) {
  const db = getDb();
  if (!db) {
    throw new Error(
      "Firebase is not configured. Create `.env.local` with NEXT_PUBLIC_FIREBASE_* values.",
    );
  }

  const servicesCol = collection(db, "services");

  // Try common field name: categoryId
  const q1 = query(servicesCol, where("categoryId", "==", categoryId), limit(100));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) return snap1.docs;

  // Fallback field name: category_id (commonly used in mobile apps)
  const q2 = query(servicesCol, where("category_id", "==", categoryId), limit(100));
  const snap2 = await getDocs(q2);
  return snap2.docs;
}

export function CategoryServices({ categoryId }: { categoryId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceDoc[]>([]);

  const stableCategoryId = useMemo(() => categoryId, [categoryId]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (mounted) {
        setLoading(true);
        setError(null);
        setServices([]);
      }

      try {
        const docs = await fetchServicesForCategory(stableCategoryId);
        const rows: ServiceDoc[] = docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        }));
        if (!mounted) return;
        setServices(rows);
      } catch (e) {
        if (!mounted) return;
        setError(
          e instanceof Error ? e.message : "Failed to load category services",
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
  }, [stableCategoryId]);

  return (
    <section className="mt-12">
      {/* Premium Section Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#0a0f1c]">
            Services in this category
          </h2>
          <p className="mt-1 text-sm text-[#64748b]">
            Showing specialized services mapped to this category.
          </p>
        </div>
        <Link 
          href="/services" 
          className="group inline-flex items-center text-sm font-bold text-[#C86A37] transition-colors hover:text-[#A85028]"
        >
          View all services 
          <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* States & Grid */}
      {error ? (
        <div className="flex items-start gap-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-900 shadow-sm">
          <AlertCircle className="mt-0.5 size-6 shrink-0 text-red-500" />
          <div>
            <h3 className="text-base font-bold">Couldn’t load services</h3>
            <p className="mt-1 text-sm text-red-700/90">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <SkeletonServiceCard key={idx} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-gray-100">
            <SearchX className="size-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-[#0a0f1c]">No services found</h3>
          <p className="mt-1 text-sm text-[#64748b]">
            This category currently has no mapped services in Firestore.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {services.map((s) => (
            <UrbanServiceCard
              key={s.id}
              service={s}
              widthClass="w-full"
            />
          ))}
        </div>
      )}
    </section>
  );
}
