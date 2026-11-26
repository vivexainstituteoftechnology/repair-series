import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import { Container } from "@/components/container";
import { LocalSeoBreadcrumbs } from "@/components/seo/local-seo-breadcrumbs";
import { LocalContactBar } from "@/components/seo/local-contact-bar";
import {
  APPLIANCE_SERVICES,
  GURGAON_LOCATIONS,
  GURGAON_ZONES,
} from "@/lib/seo/gurgaon-locations";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Home Appliance Repair Service Areas in Gurgaon (Gurugram) | Repair Series",
  description:
    "Find trusted doorstep home appliance repair near you across all 9 zones and 188+ sectors in Gurgaon. Same-day AC, washing machine, fridge, microwave & RO repair by verified technicians.",
  alternates: {
    canonical: `${SITE_URL}/service-areas`,
  },
  openGraph: {
    title: "Appliance Repair Service Areas in Gurgaon | Repair Series",
    description:
      "Doorstep appliance repair covering Palam Vihar, DLF, Golf Course Rd, Sohna Rd, New Gurgaon & Dwarka Expressway. 45-60 min arrival, transparent rates, 30-day warranty.",
    url: `${SITE_URL}/service-areas`,
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Appliance Repair Service Areas in Gurgaon | Repair Series",
    description: "Doorstep appliance repair across 188+ sectors and localities in Gurgaon.",
  },
};

const HUB_FAQS = [
  {
    q: "Which areas in Gurgaon do you serve for appliance repair?",
    a: "We cover all 9 primary zones and 188+ sectors and localities across Gurgaon, including Palam Vihar, Old Gurgaon, DLF Phase 1-5, Cyber City, Golf Course Road, Golf Course Extension, Sohna Road, New Gurgaon (Sectors 76-95), SPR, and Dwarka Expressway.",
  },
  {
    q: "How fast can a technician reach my home in Gurgaon?",
    a: "Our technicians are stationed across local hubs in Gurgaon. On average, a verified technician reaches your doorstep within 45 to 60 minutes of booking confirmation.",
  },
  {
    q: "What appliances do you repair in Gurgaon?",
    a: "We repair Air Conditioners (Split, Window, Inverter), Refrigerators, Washing Machines (Front & Top Load), Microwave Ovens, Kitchen Chimneys, RO Water Purifiers, Geysers, and LED/Smart TVs.",
  },
  {
    q: "Do you provide a warranty on repairs?",
    a: "Yes. Every repair job includes an assured 30-day service warranty and up to 90 days warranty on replacement spare parts.",
  },
  {
    q: "What are your visiting and diagnosis charges in Gurgaon?",
    a: "Our standard doorstep inspection charge is ₹199. When you approve the repair estimate, the visiting charge is adjusted in your final bill with zero hidden costs.",
  },
];

export default function ServiceAreasIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${SITE_NAME} - Home Appliance Repair Gurgaon`,
    url: `${SITE_URL}/service-areas`,
    logo: `${SITE_URL}/web-app-manifest-512x512.png`,
    image: `${SITE_URL}/web-app-manifest-512x512.png`,
    description:
      "Professional doorstep home appliance repair services across all sectors and localities in Gurgaon (Gurugram), Haryana.",
    telephone: "+919311788877",
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sector 37D",
      addressLocality: "Gurugram",
      addressRegion: "Haryana",
      postalCode: "122001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 28.4012186,
      longitude: 76.9557952,
    },
    hasMap:
      "https://www.google.com/maps/place/Repair+Series/@28.4012186,76.9557952,17z",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "21:00",
      },
    ],
    areaServed: GURGAON_ZONES.map((zone) => ({
      "@type": "AdministrativeArea",
      name: `${zone.name}, Gurgaon`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HUB_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <div className="bg-[#F8F6F4] pb-20 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero Header */}
      <section className="border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
        <Container>
          <LocalSeoBreadcrumbs items={[{ name: "Service Areas (Gurgaon)", url: "/service-areas" }]} />

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100/70 px-3 py-1 text-xs font-bold text-[#C45508] dark:bg-orange-950/60 dark:text-orange-400">
              <MapPin className="size-3.5" />
              <span>Gurgaon (Gurugram) Local Service Network</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Doorstep Home Appliance Repair Across Gurgaon
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
              Repair Series delivers fast, trusted doorstep appliance repair to homes and offices across <strong>all 9 zones</strong> and <strong>188+ sectors and localities</strong> in Gurugram, Haryana. Verified technicians reach you in 45–60 minutes.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-2xl font-black text-[#C45508]">9</p>
              <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">Gurgaon Zones</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-2xl font-black text-slate-900 dark:text-white">188+</p>
              <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">Covered Localities</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-2xl font-black text-emerald-600">45-60m</p>
              <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">Doorstep Response</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-2xl font-black text-slate-900 dark:text-white">30 Days</p>
              <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">Service Guarantee</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Body */}
      <Container className="mt-10 space-y-12">
        {/* Contact Banner */}
        <LocalContactBar areaName="All Gurgaon Sectors" variant="banner" />

        {/* Services We Deliver Section */}
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
                Appliances We Repair
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Expert Repair Services Available at Your Doorstep
              </h2>
            </div>
            <Link
              href="/services"
              className="text-xs font-bold text-[#C45508] hover:underline"
            >
              Browse Full Catalog →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {APPLIANCE_SERVICES.map((appliance) => (
              <div
                key={appliance.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-[#C45508]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100/70 text-[#C45508] dark:bg-orange-950/60 dark:text-orange-400">
                      <Wrench className="size-5" />
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      From ₹{appliance.startingPrice}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">
                    {appliance.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {appliance.avgDuration} · {appliance.warranty}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {appliance.commonIssues.slice(0, 3).map((issue, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3 text-[#C45508]" />
                        <span className="line-clamp-1">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Available across Gurgaon</span>
                  <Link
                    href={`/services`}
                    className="font-bold text-[#C45508] hover:underline"
                  >
                    Book Online →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9 Zones and 188 Locations Directory */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
              Complete Gurgaon Coverage Directory
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              Find Appliance Repair in Your Sector or Locality
            </h2>
            <p className="mt-2 text-xs text-slate-600 sm:text-sm dark:text-slate-300">
              Click any area below to view local doorstep services, response times, certified technicians, and direct booking options in your neighbourhood.
            </p>
          </div>

          <div className="mt-8 space-y-10">
            {GURGAON_ZONES.map((zone) => {
              const zoneLocations = GURGAON_LOCATIONS.filter(
                (l) => l.zoneId === zone.id || (l.secondaryZoneIds && l.secondaryZoneIds.includes(zone.id)),
              );

              return (
                <div key={zone.id} className="border-t border-slate-100 pt-6 first:border-0 first:pt-0 dark:border-slate-800">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {zone.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {zone.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {zoneLocations.length} Localities
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {zoneLocations.map((loc) => (
                      <Link
                        key={loc.slug}
                        href={`/service-areas/${loc.slug}`}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#C45508] hover:bg-[#FFF7ED] hover:text-[#C45508] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-[#E07A2B]"
                      >
                        {loc.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Google Maps Real Hub Location */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
                Central Operations Hub
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Repair Series Gurgaon Service Center &amp; Dispatch Office
              </h3>
            </div>
            <a
              href="https://www.google.com/maps/place/Repair+Series/@28.4012186,76.9557952,17z/data=!4m8!3m7!1s0x390d3d26e8925053:0x7fb0e356f61ef7c4!8m2!3d28.4012186!4d76.9557952!9m1!1b1!16s%2Fg%2F11yzq3gt89"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#C45508] shadow-2xs hover:bg-[#FFF7ED] dark:border-slate-700 dark:bg-slate-800"
            >
              <ExternalLink className="size-3.5" />
              <span>Open on Google Maps</span>
            </a>
          </div>

          <div className="h-64 w-full bg-slate-100 sm:h-80 dark:bg-slate-800">
            <iframe
              title="Repair Series Gurgaon Office Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src="https://www.google.com/maps?q=28.4012186,76.9557952&z=15&output=embed"
            />
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="text-xs">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Office Address</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                Sector 37D, Gurugram, Haryana 122001
              </p>
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Operating Hours</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                Monday to Sunday: 8:00 AM – 9:00 PM
              </p>
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Helpline &amp; Support</span>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                Same-Day Doorstep Assistance
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
            Frequently Asked Questions
          </span>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            Appliance Repair Services in Gurgaon
          </h2>

          <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
            {HUB_FAQS.map((faq, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {faq.q}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
