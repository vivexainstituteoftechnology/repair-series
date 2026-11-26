export const SITE_URL = "https://www.repairseries.in";
export const SITE_NAME = "Repair Series";

export const SERVICE_CITIES = ["Gurugram", "Hyderabad", "Aligarh"] as const;
export type ServiceCity = (typeof SERVICE_CITIES)[number];

export const SEO_KEYWORDS = [
  "AC Repair",
  "Chimney Cleaning",
  "Washing Machine Repair",
  "RO Service",
  "Refrigerator Repair",
  "Microwave Repair",
  "Electrician",
  "Plumber",
  "Geyser Repair",
  "TV Repair",
  "Deep Cleaning",
  "Appliance Repair",
] as const;

export function citySlug(city: ServiceCity | string): string {
  return String(city)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function cityFromSlug(slug: string): ServiceCity | null {
  const normalized = citySlug(slug);
  return (
    SERVICE_CITIES.find((city) => citySlug(city) === normalized) ?? null
  );
}

export function getCityPath(city: ServiceCity): string {
  return `/cities/${citySlug(city)}`;
}

export function cityServiceTitle(service: string, city: ServiceCity): string {
  return `${service} in ${city}`;
}

export function buildDefaultDescription(city?: ServiceCity): string {
  if (city) {
    return `Book trusted home appliance repair and service in ${city}. Same-day AC repair, washing machine service, refrigerator repair, microwave & RO service by verified technicians. 30-day warranty.`;
  }
  return `Book trusted home appliance repair in Gurgaon (Gurugram) across 188+ sectors. Same-day AC repair, washing machine service, refrigerator repair, microwave, RO & geyser service. Verified technicians, transparent pricing & 30-day warranty.`;
}

export function buildDefaultTitle(city?: ServiceCity): string {
  if (city) {
    return `Home Appliance Repair & Service in ${city} | ${SITE_NAME}`;
  }
  return `Home Appliance Repair in Gurgaon (Gurugram) | Same-Day Service | ${SITE_NAME}`;
}

export function buildCityLandingCopy(city: ServiceCity) {
  return {
    headline: `Trusted appliance repair in ${city}`,
    intro: `Repair Series brings same-day AC repair, washing machine service, RO servicing, refrigerator repair, electrician, plumber, and deep cleaning to homes across ${city}. Book verified technicians online with clear pricing and a service warranty.`,
    bullets: [
      `Same-day doorstep service across ${city}`,
      "Background-verified technicians",
      "Transparent pricing before work begins",
      "Genuine parts with service warranty",
    ],
  };
}
