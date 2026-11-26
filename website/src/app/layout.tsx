import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import Dock from "@/components/dock";
import { SiteHeader } from "@/components/site-header";
import { MobileAppHeader } from "@/components/mobile-app-header";
import { AppProviders } from "@/components/providers";
import { SplashScreen } from "@/components/splash-screen";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ServiceDetailModal } from "@/components/services/service-detail-modal";
import {
  buildDefaultDescription,
  buildDefaultTitle,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/site";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const defaultDescription = buildDefaultDescription();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#C86A37",
};

export const metadata: Metadata = {
  title: {
    default: buildDefaultTitle(),
    template: `%s · ${SITE_NAME}`,
  },
  description: defaultDescription,
  keywords: [
    "AC Repair Gurgaon",
    "Appliance Repair Gurgaon",
    "AC Repair Near Me",
    "Home Appliance Repair in Gurgaon",
    "AC Repair Palam Vihar",
    "Washing Machine Repair Gurgaon",
    "Refrigerator Repair Gurgaon",
    "RO Service Gurgaon",
    "Chimney Cleaning Gurgaon",
    "Microwave Repair Gurgaon",
    "Geyser Repair Gurgaon",
    "TV Repair Gurgaon",
    "Doorstep Appliance Repair",
    "Best Appliance Repair Near Me",
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: buildDefaultTitle(),
    description: defaultDescription,
    locale: "en_IN",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: buildDefaultTitle(),
    description: defaultDescription,
    images: ["/web-app-manifest-512x512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} font-sans h-full antialiased`}
    >
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <body className="flex min-h-full flex-col bg-[#F8F6F4] text-foreground md:bg-background">
        <AppProviders>
          <SplashScreen />
          <CartDrawer />
          <ServiceDetailModal />
          <SiteHeader />
          <MobileAppHeader />
          <main className="flex-1 pb-24 sm:pb-28">{children}</main>
          <div className="hidden md:block">
            <SiteFooter />
          </div>
          <Dock />
        </AppProviders>
      </body>
    </html>
  );
}
