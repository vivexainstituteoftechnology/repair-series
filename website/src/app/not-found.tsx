import Link from "next/link";
import { ArrowLeft, Home, MapPin, Search, Wrench } from "lucide-react";
import { Container } from "@/components/container";

export const metadata = {
  title: "Page Not Found (404) | Repair Series",
  description: "The page you are looking for might have been moved or does not exist. Browse our appliance repair services and Gurgaon service areas.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center py-16">
      <Container className="max-w-xl text-center">
        <span className="inline-block rounded-2xl bg-orange-100 px-4 py-1.5 text-sm font-extrabold text-[#C45508]">
          404 · Page Not Found
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Looking for Appliance Repair?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          The page or link you followed could not be found. You can browse our home services catalog or select your Gurgaon service area below.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#C45508] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#A84506] active:scale-95"
          >
            <Home className="size-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/service-areas"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <MapPin className="size-4 text-[#C45508]" />
            <span>Gurgaon Service Areas</span>
          </Link>
          <Link
            href="/services"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <Wrench className="size-4 text-slate-500" />
            <span>View Services</span>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Popular Repair Services:
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[
              { name: "AC Repair & Service", href: "/services" },
              { name: "Refrigerator Repair", href: "/services" },
              { name: "Washing Machine Service", href: "/services" },
              { name: "Microwave Oven Repair", href: "/services" },
              { name: "Kitchen Chimney Cleaning", href: "/services" },
              { name: "RO Water Purifier", href: "/services" },
            ].map((srv) => (
              <Link
                key={srv.name}
                href={srv.href}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-[#C45508] hover:text-[#C45508] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {srv.name}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
