"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { RemoteImage as Image } from "@/components/remote-image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCategoryPath, getHierarchyPath } from "@/lib/catalog/slug";
import { isWallPanelCatalogItem } from "@/lib/catalog/wallPanel";
import { isCatalogActive, sortByDisplayOrder } from "@/lib/catalog/hierarchy";
import { getDb } from "@/lib/firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

type CategoryDoc = {
  id: string;
  name?: string;
  title?: string;
  image?: string;
  icon?: string;
  slug?: string;
  active?: boolean;
  isActive?: boolean;
};

function getCategoryName(c: CategoryDoc) {
  return c.name ?? c.title ?? "Category";
}

function getCategoryImage(c: CategoryDoc) {
  return c.icon ?? c.image ?? null;
}

export function CategoriesGrid() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [serviceTypes, setServiceTypes] = useState<CategoryDoc[]>([]);

  const categoriesCol = useMemo(() => {
    const db = getDb();
    return db ? collection(db, "categories") : null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (mounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const db = getDb();
        if (!db || !categoriesCol) {
          throw new Error(
            "Firebase is not configured. Create `.env.local` with NEXT_PUBLIC_FIREBASE_* values.",
          );
        }
        const q = query(categoriesCol, orderBy("name", "asc"));
        const [typeSnap, catSnap] = await Promise.all([
          getDocs(collection(db, "serviceTypes")).catch(() => null),
          getDocs(q),
        ]);
        const rows: CategoryDoc[] = catSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        }));
        const types: CategoryDoc[] = typeSnap
          ? typeSnap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Record<string, unknown>),
            }))
          : [];
        if (!mounted) return;
        setCategories(rows.filter((c) => isCatalogActive(c)));
        setServiceTypes(sortByDisplayOrder(types.filter((c) => isCatalogActive(c))));
      } catch (e) {
        if (!mounted) return;
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load categories from Firestore",
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
  }, [categoriesCol]);

  if (error) {
    return (
      <div className="mt-6 rounded-2xl border bg-card p-6">
        <div className="text-sm font-medium">Couldn’t load categories</div>
        <div className="mt-2 text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-xl mb-3" />
            <div className="flex items-center justify-between gap-2 px-1 py-1">
              <Skeleton className="h-4 w-3/5 rounded-md" />
              <Skeleton className="size-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tiles = serviceTypes.length ? serviceTypes : categories;

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((c) => {
        const name = getCategoryName(c);
        const img = getCategoryImage(c);
        const href = isWallPanelCatalogItem(c)
          ? "/wall-panel"
          : serviceTypes.length
            ? getHierarchyPath([c])
            : getCategoryPath(c);

        return (
          <Link
            key={c.id}
            href={href}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 mb-3">
              {img ? (
                <Image
                  alt={name}
                  src={img}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-xs font-semibold text-slate-400">
                  RepairSeries
                </div>
              )}
              <span className="absolute top-2 right-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200 shadow-2xs">
                ⚡ 15-30 mins
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="truncate text-sm font-bold text-slate-900 group-hover:text-[#C86A37] transition-colors">{name}</div>
              <span className="text-[11px] font-bold text-[#C86A37] shrink-0">Explore →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

