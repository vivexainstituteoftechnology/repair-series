import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  GURGAON_LOCATIONS,
  generateLocalSeoMeta,
  generateLocationFaqs,
  getLocationBySlug,
  getNearbyLocations,
  getZoneById,
} from "@/lib/seo/gurgaon-locations";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { LocationHomeClient } from "@/components/seo/location-home-client";

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
    telephone: "+919311788877",
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
      />
    </>
  );
}
