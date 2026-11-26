import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
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
import { LocalServiceCard } from "@/components/seo/local-service-card";
import {
  APPLIANCE_SERVICES,
  GURGAON_LOCATIONS,
  generateLocalSeoMeta,
  generateLocationFaqs,
  getLocationBySlug,
  getNearbyLocations,
  getZoneById,
} from "@/lib/seo/gurgaon-locations";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const dynamicParams = true;

type PageProps = {
  params: Promise<{ areaSlug: string }>;
};

// Generate static params for the most popular Gurgaon sectors and hubs
export function generateStaticParams() {
  return GURGAON_LOCATIONS.slice(0, 40).map((loc) => ({
    areaSlug: loc.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { areaSlug } = await params;
  const location = getLocationBySlug(areaSlug);

  if (!location) {
    return {
      title: "Location Not Found | Repair Series",
      description: "Appliance repair location not found.",
    };
  }

  const meta = generateLocalSeoMeta({
    location,
    path: `/service-areas/${location.slug}`,
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

export default async function LocationLandingPage({ params }: PageProps) {
  const { areaSlug } = await params;
  const location = getLocationBySlug(areaSlug);

  if (!location) {
    notFound();
  }

  const zone = getZoneById(location.zoneId);
  const faqs = generateLocationFaqs(location);
  const nearby = getNearbyLocations(location, 8);
  const canonicalUrl = `${SITE_URL}/service-areas/${location.slug}`;

  // Structured Data (LocalBusiness + BreadcrumbList + FAQPage)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${SITE_NAME} - Appliance Repair in ${location.name}, Gurgaon`,
    url: canonicalUrl,
    telephone: "+911800000111",
    priceRange: "₹₹",
    image: `${SITE_URL}/web-app-manifest-512x512.png`,
    description: `Professional doorstep appliance repair service in ${location.name}, Gurgaon. Same-day AC, washing machine, refrigerator, microwave, and RO service with 30-day warranty.`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Header Section */}
      <section className="border-b border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-900">
        <Container>
          <LocalSeoBreadcrumbs
            items={[
              { name: "Service Areas", url: "/service-areas" },
              ...(zone ? [{ name: zone.name, url: "/service-areas" }] : []),
              { name: location.name, url: `/service-areas/${location.slug}` },
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
                <span>Arrival: {location.responseTime}</span>
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Home Appliance Repair in {location.name}, Gurgaon
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
              Need fast, reliable home appliance repair in <strong>{location.name}</strong>, Gurgaon? Repair Series connects you with verified local technicians for AC, refrigerator, washing machine, microwave, chimney, geyser, and RO servicing at your doorstep.
            </p>
          </div>

          {/* Service Guarantee Badges */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">30-Day Guarantee</p>
                <p className="text-[11px] text-slate-500">Service warranty included</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <Zap className="size-5 shrink-0 text-[#C45508]" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">45–60 Mins Arrival</p>
                <p className="text-[11px] text-slate-500">Fast doorstep response</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <CheckCircle2 className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">KYC Verified Techs</p>
                <p className="text-[11px] text-slate-500">Background-checked partners</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <Wrench className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Genuine Parts</p>
                <p className="text-[11px] text-slate-500">Up to 90 days parts warranty</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container className="mt-10 space-y-12">
        {/* Contact Banner */}
        <LocalContactBar areaName={location.name} variant="banner" />

        {/* Appliance Services Grid */}
        <section>
          <div className="mb-6">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
              Services in {location.name}
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              Doorstep Appliance Repair Services in {location.name}
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-300">
              Click any appliance below for transparent repair pricing, technician availability, and instant booking in {location.name}, Gurgaon.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {APPLIANCE_SERVICES.map((service) => (
              <LocalServiceCard
                key={service.id}
                service={service}
                location={location}
              />
            ))}
          </div>
        </section>

        {/* Localized Area Details & Landmarks */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
              Local Neighbourhood Coverage
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              Service Availability &amp; Landmarks in {location.name}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
              Our mobile technician fleet is positioned near prominent hubs in and around {location.name} including{" "}
              <strong>{location.landmarks.join(", ")}</strong>, ensuring rapid 45 to 60 minute emergency response for sudden appliance breakdowns.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold uppercase text-slate-500">Service Zone</span>
              <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                {zone?.name || "Gurgaon Central"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold uppercase text-slate-500">Postal Code</span>
              <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                {location.pincode}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold uppercase text-slate-500">Typical Arrival</span>
              <p className="mt-1 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {location.responseTime}
              </p>
            </div>
          </div>
        </section>

        {/* Local FAQs */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
            Questions &amp; Answers
          </span>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            Appliance Repair in {location.name} FAQ
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

        {/* Nearby Service Areas (Lateral Internal Links) */}
        {nearby.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#C45508]">
                  Explore Nearby Locations
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Appliance Repair Near {location.name}, Gurgaon
                </h2>
              </div>
              <Link
                href="/service-areas"
                className="text-xs font-bold text-[#C45508] hover:underline"
              >
                View All 188 Locations →
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {nearby.map((near) => (
                <Link
                  key={near.slug}
                  href={`/service-areas/${near.slug}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#C45508] hover:bg-[#FFF7ED] hover:text-[#C45508] dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {near.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Sticky Mobile Contact Bar */}
      <LocalContactBar areaName={location.name} variant="sticky" />
    </div>
  );
}
