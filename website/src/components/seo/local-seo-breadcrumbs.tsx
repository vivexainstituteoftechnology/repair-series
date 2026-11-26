import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { SITE_URL } from "@/lib/seo/site";

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function LocalSeoBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ name: "Home", url: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumbs" className="mb-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        {allItems.map((item, idx) => {
          const isLast = idx === allItems.length - 1;
          return (
            <li key={item.url} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="size-3 text-slate-400" />}
              {isLast ? (
                <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[200px] sm:max-w-none">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="flex items-center gap-1 transition hover:text-[#C45508] dark:hover:text-[#E07A2B]"
                >
                  {idx === 0 && <Home className="size-3.5" />}
                  <span>{item.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
