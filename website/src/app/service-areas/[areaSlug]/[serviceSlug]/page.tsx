import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
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
  generateLocalSeoMeta,
  generateLocationFaqs,
  getApplianceBySlug,
  getLocationBySlug,
  getNearbyLocations,
  getZoneById,
} from "@/lib/seo/gurgaon-locations";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const dynamicParams = true;

type PageProps = {
  params: Promise<{ areaSlug: string; serviceSlug: string }>;
};

// Generate static params for the most high-intent combinations
export function generateStaticParams() {
  const topLocations = GURGAON_LOCATIONS.slice(0, 15);
  const topServices = APPLIANCE_SERVICES.slice(0, 5);
  const params: Array<{ areaSlug: string; serviceSlug: string }> = [];

  topLocations.forEach((loc) => {
    topServices.forEach((srv) => {
      params.push({ areaSlug: loc.slug, serviceSlug: srv.slug });
    });
  });

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaSlug, serviceSlug } = await params;
  const location = getLocationBySlug(areaSlug);
  const appliance = getApplianceBySlug(serviceSlug);

  if (!location || !appliance) {
    return {
      title: "Service Not Found | Repair Series",
      description: "Appliance repair service not found.",
    };
  }

  const meta = generateLocalSeoMeta({
    location,
    appliance,
    path: `/service-areas/${location.slug}/${appliance.slug}`,
  });

  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical: meta.canonicalUrl,
    },
    openGraph: {
      title: meta.ogTitle,
      description: meta.ogDescription,
      url: meta.canonicalUrl,
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.ogTitle,
      description: meta.ogDescription,
    },
  };
}

export default async function ServiceLocationPage({ params }: PageProps) {
  const { areaSlug, serviceSlug } = await params;
  const location = getLocationBySlug(areaSlug);
  const appliance = getApplianceBySlug(serviceSlug);

  if (!location || !appliance) {
    notFound();
  }

  const zone = getZoneById(location.zoneId);
  const faqs = generateLocationFaqs(location, appliance);
  const nearby = getNearbyLocations(location, 6);
  const otherServices = APPLIANCE_SERVICES.filter((s) => s.id !== appliance.id);
  const canonicalUrl = `${SITE_URL}/service-areas/${location.slug}/${appliance.slug}`;

  // Structured Data (LocalBusiness + Service + BreadcrumbList + FAQPage)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${SITE_NAME} - ${appliance.name} in ${location.name}, Gurgaon`,
    url: canonicalUrl,
    telephone: "+911800000111",
    priceRange: "₹₹",
    image: `${SITE_URL}/web-app-manifest-512x512.png`,
    description: `Professional doorstep ${appliance.name} in ${location.name}, Gurgaon. Arriving in 45-60 mins with 30-day warranty and genuine spare parts.`,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.landmarks[0] || `${location.name}, Sector 37D`,
      addressLocality: "Gurugram",
      addressRegion: "Haryana",
      postalCode: location.pincode,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 28.4012186,
      longitude: 76.9557952,
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: `${location.name}, Gurgaon`,
    },
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
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${appliance.name} in ${location.name}, Gurgaon`,
    serviceType: appliance.name,
    provider: {
      "@type": "LocalBusiness",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: `${location.name}, Gurgaon`,
    },
    offers: {
      "@type": "Offer",
      price: String(appliance.startingPrice),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: "2026-01-01",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <div className="bg-[#F8F6F4] pb-24 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Header Section */}
      <section className="border-b border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-900">
        <Container>
          <LocalSeoBreadcrumbs
            items={[
              { name: "Service Areas", url: "/service-areas" },
              { name: location.name, url: `/service-areas/${location.slug}` },
              {
                name: appliance.name,
                url: `/service-areas/${location.slug}/${appliance.slug}`,
              },
            ]}
          />

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/70 px-3 py-1 text-xs font-bold text-[#C45508] dark:bg-orange-950/60 dark:text-orange-400">
                <MapPin className="size-3.5" />
                <span>{location.name}, Gurgaon (PIN: {location.pincode})</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Clock className="size-3" />
                <span>Doorstep in {location.responseTime}</span>
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              {appliance.name} in {location.name}, Gurgaon
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
              Expert, same-day <strong>{appliance.name}</strong> delivered directly to your doorstep in <strong>{location.name}</strong>, Gurgaon. Background-verified technicians, upfront transparent diagnosis, genuine spare parts, and an assured 30-day service warranty.
            </p>
          </div>

          {/* Service Guarantee Badges */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">30-Day Warranty</p>
                <p className="text-[11px] text-slate-500">Service guaranteed</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <Zap className="size-5 shrink-0 text-[#C45508]" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">₹{appliance.startingPrice} Onwards</p>
                <p className="text-[11px] text-slate-500">Transparent pricing</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <CheckCircle2 className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">KYC Verified Techs</p>
                <p className="text-[11px] text-slate-500">Trained &amp; certified</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <Wrench className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Genuine Parts</p>
                <p className="text-[11px] text-slate-500">Manufacturer warranty</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container className="mt-10 space-y-12">
        {/* Contact Banner */}
        <LocalContactBar
          areaName={location.name}
          serviceName={appliance.name}
          variant="banner"
        />

        {/* Sub-Services & Pricing Breakdown Table */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
              Transparent Pricing &amp; Solutions
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {appliance.name} Solutions &amp; Rates in {location.name}
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-300">
              Upfront quotes provided by our technician after on-site inspection. Visiting charge of ₹199 is adjusted in your final repair bill.
            </p>
          </div>

          <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
            {appliance.subServices.map((sub, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 text-[#C45508] dark:bg-orange-950/60 dark:text-orange-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {sub}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Doorstep service in {location.name} · Genuine parts included
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ₹{appliance.startingPrice + idx * 100}*
                  </span>
                  <Link
                    href={`/services`}
                    className="inline-flex h-8 items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <span>Book</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            *Exact price depends on appliance brand, capacity, and specific parts required. Quotation given before beginning work.
          </p>
        </section>

        {/* Common Issues Fixed & Appliance Types */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
              Diagnostics
            </span>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              Common {appliance.shortName} Issues We Fix in {location.name}
            </h2>
            <ul className="mt-5 space-y-3">
              {appliance.commonIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#C45508]" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
              Coverage &amp; Models
            </span>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              {appliance.shortName} Types &amp; Brands Supported
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {appliance.typesSupported.map((type, idx) => (
                <span
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                >
                  {type}
                </span>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Major Brands Serviced:
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                Samsung, LG, Whirlpool, Daikin, Voltas, Hitachi, IFB, Bosch, Haier, Godrej, Panasonic, Blue Star, Carrier, Lloyd, and more.
              </p>
            </div>
          </div>
        </section>

        {/* 4-Step Doorstep Workflow */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
            How It Works
          </span>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            Simple 4-Step Doorstep Repair in {location.name}
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#C45508] text-xs font-black text-white">
                1
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                Book Online or Call
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Select {appliance.shortName} repair, enter your address in {location.name}, and pick your preferred time slot.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#C45508] text-xs font-black text-white">
                2
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                Arrival in 45–60 Mins
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Our background-verified technician arrives at your doorstep in {location.name} with standard diagnostic tools.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#C45508] text-xs font-black text-white">
                3
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                Upfront Quotation
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Detailed inspection followed by transparent estimate. Repair begins only after your approval.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#C45508] text-xs font-black text-white">
                4
              </span>
              <h3 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                30-Day Warranty
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Pay securely via UPI, Card, or Cash upon job satisfaction. Enjoy our 30-day service warranty.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
            FAQ
          </span>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {appliance.name} in {location.name} FAQ
          </h2>

          <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
            {faqs.map((faq, idx) => (
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

        {/* Cross-Sell Other Appliances in This Location */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
                Other Services in {location.name}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                More Appliance Repairs in {location.name}, Gurgaon
              </h2>
            </div>
            <Link
              href={`/service-areas/${location.slug}`}
              className="text-xs font-bold text-[#C45508] hover:underline"
            >
              All {location.name} Services →
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {otherServices.map((srv) => (
              <Link
                key={srv.id}
                href={`/service-areas/${location.slug}/${srv.slug}`}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#C45508] hover:bg-[#FFF7ED] hover:text-[#C45508] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {srv.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Lateral Links: Same Appliance in Nearby Areas */}
        {nearby.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
                  Nearby Locations
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {appliance.name} Near {location.name}, Gurgaon
                </h2>
              </div>
              <Link
                href="/service-areas"
                className="text-xs font-bold text-[#C45508] hover:underline"
              >
                All Service Areas →
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {nearby.map((near) => (
                <Link
                  key={near.slug}
                  href={`/service-areas/${near.slug}/${appliance.slug}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#C45508] hover:bg-[#FFF7ED] hover:text-[#C45508] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {appliance.shortName} in {near.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Sticky Mobile Contact Bar */}
      <LocalContactBar
        areaName={location.name}
        serviceName={appliance.name}
        variant="sticky"
      />
    </div>
  );
}
