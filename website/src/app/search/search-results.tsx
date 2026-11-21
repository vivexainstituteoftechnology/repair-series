"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { Search } from "lucide-react";
import { Container } from "@/components/container";
import { ServicePrice } from "@/components/services/service-price";
import { AddToCartButton } from "@/components/services/add-to-cart-button";
import { useCatalog } from "@/context/catalog-context";
import { getCategoryPath, getServicePath } from "@/lib/catalog/slug";
import { searchCatalog } from "@/lib/search/catalog-search";
import { SectionPromoBanner } from "@/components/home/promo-banner";

export default function SearchResultsClient({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q: rawQ, type: rawType } = use(searchParams);
  const q = String(rawQ ?? "").trim();
  const typeId = String(rawType ?? "").trim();
  const { services, categories, loading } = useCatalog();

  const results = useMemo(
    () => searchCatalog(q, services, categories, 50, { serviceTypeId: typeId }),
    [q, services, categories, typeId],
  );

  const empty = !loading && q && results.services.length === 0 && results.categories.length === 0;

  return (
    <div className="animate-in fade-in duration-500 bg-[#F8F6F4] py-4 md:bg-transparent md:py-10">
      <Container>
        <div className="-mx-4 mb-2 md:mx-0">
          <SectionPromoBanner section="search" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C86A37]">
            <Search className="size-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {q ? `Results for "${q}"` : "Search Services"}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              AC repair, cleaning, electrician & more across Gurugram, Hyderabad & Aligarh.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#C86A37]" />
          </div>
        ) : empty ? (
          <div className="mt-12 rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-xs">
            <p className="text-lg font-bold text-slate-900">No services found</p>
            <p className="mt-1 text-sm text-slate-500">Try searching for AC repair, electrician, or plumbing.</p>
            <Link href="/services" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#C86A37] to-[#A85028] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition">
              Browse All Services
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {results.services.length > 0 ? (
              <section>
                <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-400">Services ({results.services.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
                    >
                      <Link href={getServicePath(s)} className="block">
                        <div className="font-bold text-slate-900 hover:text-[#C86A37] transition-colors">{s.name ?? s.title}</div>
                        <ServicePrice service={s} className="mt-1 font-bold text-slate-900" />
                      </Link>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          href={getServicePath(s)}
                          className="text-xs font-bold text-slate-500 hover:text-[#C86A37] transition-colors"
                        >
                          View Details
                        </Link>
                        <AddToCartButton service={s} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {results.categories.length > 0 ? (
              <section>
                <h2 className="mb-4 text-xs font-black uppercase tracking-wider text-slate-400">Categories ({results.categories.length})</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {results.categories.map((c) => (
                    <Link
                      key={c.id}
                      href={getCategoryPath(c)}
                      className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-xs font-bold text-slate-900 transition hover:border-[#C86A37]/50 hover:shadow-xs"
                    >
                      <span>{c.name ?? c.title}</span>
                      <span className="text-[#C86A37] text-xs">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </Container>
    </div>
  );
}
