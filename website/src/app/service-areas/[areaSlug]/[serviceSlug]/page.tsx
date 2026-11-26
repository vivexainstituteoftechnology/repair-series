import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { LocationHomeClient } from "@/components/seo/location-home-client";

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
  const nearby = getNearbyLocations(location, 8);
  const canonicalUrl = `${SITE_URL}/service-areas/${location.slug}/${appliance.slug}`;

  // Structured Data (LocalBusiness + Service + BreadcrumbList + FAQPage)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${SITE_NAME} - ${appliance.name} in ${location.name}, Gurgaon`,
    url: canonicalUrl,
    telephone: "+919311788877",
    priceRange: "₹₹",
    image: `${SITE_URL}/web-app-manifest-512x512.png`,
    description: `Professional doorstep ${appliance.name} in ${location.name}, Gurgaon. Arriving in ${location.responseTime} with 30-day warranty and genuine spare parts.`,
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Service Areas",
        item: `${SITE_URL}/service-areas`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: location.name,
        item: `${SITE_URL}/service-areas/${location.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: appliance.name,
        item: canonicalUrl,
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
    <>
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LocationHomeClient
        location={location}
        zone={zone}
        nearby={nearby}
        faqs={faqs}
        appliance={appliance}
      />
    </>
  );
}
