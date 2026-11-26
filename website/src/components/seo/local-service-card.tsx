import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Wrench } from "lucide-react";
import type { ApplianceService, GurgaonLocation } from "@/lib/seo/gurgaon-locations";

type Props = {
  service: ApplianceService;
  location: GurgaonLocation;
};

export function LocalServiceCard({ service, location }: Props) {
  const serviceAreaUrl = `/service-areas/${location.slug}/${service.slug}`;
  const catalogUrl = `/services`;

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-[#C45508]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-100/70 text-[#C45508] dark:bg-orange-950/60 dark:text-orange-400">
              <Wrench className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#C45508] transition-colors dark:text-white">
                <Link href={serviceAreaUrl}>{service.name}</Link>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                in {location.name}, Gurgaon
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            ₹{service.startingPrice} onwards
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 font-medium">
            <Clock className="size-3.5 text-slate-400" />
            {service.avgDuration}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            30-Day Warranty
          </span>
        </div>

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Common Problems Fixed:
          </p>
          <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
            {service.commonIssues.slice(0, 3).map((issue, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#C45508]" />
                <span className="line-clamp-1">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Link
          href={serviceAreaUrl}
          className="text-xs font-bold text-[#C45508] hover:underline"
        >
          View {service.shortName} Rates in {location.name} →
        </Link>
        <Link
          href={catalogUrl}
          className="inline-flex h-8 items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <span>Book Now</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
