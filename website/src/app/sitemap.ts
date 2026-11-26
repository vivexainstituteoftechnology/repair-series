import { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { hasFirebaseWebConfig } from "@/lib/firebase/client";
import { getDb } from "@/lib/firebase/firestore";
import { citySlug, SERVICE_CITIES, SITE_URL } from "@/lib/seo/site";
import {
  APPLIANCE_SERVICES,
  GURGAON_LOCATIONS,
} from "@/lib/seo/gurgaon-locations";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Core static website pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/service-areas`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/refund`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    ...SERVICE_CITIES.map((city) => ({
      url: `${SITE_URL}/cities/${citySlug(city)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];

  // All 188 unique Gurgaon location landing pages
  const locationRoutes: MetadataRoute.Sitemap = GURGAON_LOCATIONS.map((loc) => ({
    url: `${SITE_URL}/service-areas/${loc.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Top high-intent service + location pages across Gurgaon hubs
  // Top 30 locations x 5 core appliances = 150 high-impact landing pages
  const topLocations = GURGAON_LOCATIONS.slice(0, 30);
  const coreServices = APPLIANCE_SERVICES.slice(0, 5);
  const serviceLocationRoutes: MetadataRoute.Sitemap = [];

  topLocations.forEach((loc) => {
    coreServices.forEach((srv) => {
      serviceLocationRoutes.push({
        url: `${SITE_URL}/service-areas/${loc.slug}/${srv.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      });
    });
  });

  const baseSitemap = [
    ...staticRoutes,
    ...locationRoutes,
    ...serviceLocationRoutes,
  ];

  try {
    if (!hasFirebaseWebConfig()) return baseSitemap;

    const db = getDb();
    if (!db) return baseSitemap;

    const withTimeout = <T>(p: Promise<T>, ms = 2500): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
      ]);

    const [servicesSnapshot, categoriesSnapshot] = await Promise.all([
      withTimeout(getDocs(collection(db, "services"))).catch(() => null),
      withTimeout(getDocs(collection(db, "categories"))).catch(() => null),
    ]);

    const dynamicServices: MetadataRoute.Sitemap = servicesSnapshot
      ? servicesSnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const slug = data.slug || docSnap.id;
          return {
            url: `${SITE_URL}/services/${slug}`,
            lastModified: now,
            changeFrequency: "monthly" as const,
            priority: 0.65,
          };
        })
      : [];

    const dynamicCategories: MetadataRoute.Sitemap = categoriesSnapshot
      ? categoriesSnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const slug = data.slug || docSnap.id;
          return {
            url: `${SITE_URL}/categories/${slug}`,
            lastModified: now,
            changeFrequency: "monthly" as const,
            priority: 0.7,
          };
        })
      : [];

    return [...baseSitemap, ...dynamicCategories, ...dynamicServices];
  } catch {
    return baseSitemap;
  }
}
