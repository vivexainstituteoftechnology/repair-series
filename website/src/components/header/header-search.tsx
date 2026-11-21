"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Wrench, ArrowRight } from "lucide-react";
import { useRotatingSearchPlaceholder } from "@/lib/search/use-rotating-placeholder";
import { useCatalog } from "@/context/catalog-context";
import { searchCatalog } from "@/lib/search/catalog-search";
import { getCategoryPath, getServicePath } from "@/lib/catalog/slug";

export function HeaderSearch() {
  const router = useRouter();
  const { services, categories } = useCatalog();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rotatingPlaceholder = useRotatingSearchPlaceholder(
    focused || query.trim().length > 0,
  );

  const results = useMemo(
    () => searchCatalog(query, services, categories, 6),
    [query, services, categories],
  );

  const hasQuery = query.trim().length > 0;
  const empty = hasQuery && results.services.length === 0 && results.categories.length === 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goSearchPage = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }, [query, router]);

  return (
    <div ref={wrapRef} className="relative flex-1 max-w-xl">
      {/* Urban Company Rounded Pill Search Bar */}
      <div className="relative flex h-11 w-full items-center gap-3 rounded-full border border-slate-200/90 bg-slate-50/70 hover:bg-white focus-within:bg-white focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-[#C86A37]/15 px-4 transition-all">
        <Search className="size-4 shrink-0 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={
            focused || query.trim()
              ? "Search for services & appliances..."
              : rotatingPlaceholder || "Search for 'AC service', 'Washing machine'..."
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              goSearchPage();
            }
          }}
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          aria-label="Search services"
          autoComplete="off"
        />
      </div>

      {/* Suggestion Popover Dropdown */}
      {open && (hasQuery || results.services.length > 0) ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
          {empty ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs font-bold text-slate-700">No matching services found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching for AC, Electrician, Plumber, or Chimney</p>
            </div>
          ) : (
            <div className="p-2 space-y-1 max-h-[360px] overflow-y-auto">
              {results.services.length > 0 ? (
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Services
                </div>
              ) : null}
              {results.services.map((s) => (
                <Link
                  key={s.id}
                  href={getServicePath(s)}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-[#FFF7ED] hover:text-[#C86A37]"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                      <Wrench className="size-3.5" />
                    </div>
                    <span className="truncate">{s.name ?? s.title}</span>
                  </div>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                    Service
                  </span>
                </Link>
              ))}

              {results.categories.length > 0 ? (
                <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-t border-slate-100">
                  Categories
                </div>
              ) : null}
              {results.categories.map((c) => (
                <Link
                  key={c.id}
                  href={getCategoryPath(c)}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                >
                  <span className="truncate">{c.name ?? c.title}</span>
                  <span className="text-[11px] font-bold text-slate-400">View category</span>
                </Link>
              ))}
            </div>
          )}

          {hasQuery ? (
            <button
              type="button"
              onClick={goSearchPage}
              className="flex w-full items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-left text-xs font-bold text-[#C86A37] hover:bg-[#FFF7ED] transition-colors"
            >
              <span>See all results for &ldquo;{query.trim()}&rdquo;</span>
              <ArrowRight className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
