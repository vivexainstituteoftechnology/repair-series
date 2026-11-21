import { Container } from "@/components/container";
import { ServicesGrid } from "@/app/services/services-grid";
import {
  PromoBannerSection,
  SectionPromoBanner,
} from "@/components/home/promo-banner";

export const metadata = {
  title: "Our Services | Repair Series",
  description:
    "Browse AC repair, washing machine service, RO service, cleaning & more in Gurugram, Hyderabad & Aligarh. Book a certified technician instantly.",
  alternates: { canonical: "https://www.repairseries.in/services" },
};

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F6F4] font-sans text-[#1e293b] md:bg-white">
      {/* Mobile trust banner */}
      <section className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50/40 to-orange-50 px-4 py-3 md:hidden">
        <p className="text-xs font-semibold text-[#C45508]">
          ⚡ Certified technicians · Upfront transparent pricing · 30-day warranty
        </p>
      </section>

      <div className="md:hidden">
        <SectionPromoBanner section="services" />
      </div>

      {/* Desktop Page Header */}
      <section className="hidden border-b border-gray-100 bg-[#f8fafc] py-16 text-center sm:py-20 md:block">
        <Container className="max-w-[800px]">
          <span className="mb-4 inline-block rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#f96316] shadow-sm">
            Our Expertise
          </span>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-[#0a0f1c] sm:text-5xl">
            Premium Home Services
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#64748b]">
            Browse our comprehensive range of appliance repair and maintenance services. Book a certified technician instantly across Gurugram, Hyderabad & Aligarh.
          </p>
        </Container>
      </section>

      <section className="py-4 sm:py-20 md:py-12">
        <Container>
          <div className="mb-6 hidden md:block">
            <PromoBannerSection section="services" />
          </div>
          <ServicesGrid />
        </Container>
      </section>
    </div>
  );
}
