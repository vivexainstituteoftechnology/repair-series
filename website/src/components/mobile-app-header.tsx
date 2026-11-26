"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Search, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

function getPageTitle(pathname: string): string {
  if (pathname === "/cart") return "My Cart";
  if (pathname.startsWith("/cart/checkout")) return "Checkout";
  if (pathname === "/services") return "Our Services";
  if (pathname.startsWith("/services/")) return "Service Details";
  if (pathname === "/categories") return "Categories";
  if (pathname.startsWith("/categories/")) return "Category";
  if (pathname.startsWith("/category/")) return "Category";
  if (pathname.startsWith("/dashboard/bookings/")) return "Booking Details";
  if (pathname.startsWith("/dashboard/bookings")) return "My Bookings";
  if (pathname.startsWith("/dashboard/profile")) return "My Profile";
  if (pathname.startsWith("/dashboard/addresses")) return "Saved Addresses";
  if (pathname.startsWith("/dashboard")) return "My Account";
  if (pathname.startsWith("/search")) return "Search";
  if (pathname.startsWith("/book")) return "Book Service";
  if (pathname.startsWith("/auth") || pathname.startsWith("/login")) return "Account Sign In";
  if (pathname.startsWith("/about")) return "About Us";
  if (pathname.startsWith("/contact")) return "Contact Us";
  if (pathname.startsWith("/privacy-policy")) return "Privacy Policy";
  if (pathname.startsWith("/terms")) return "Terms of Service";
  if (pathname.startsWith("/refund")) return "Refund Policy";
  if (pathname.startsWith("/delete-account")) return "Delete Account";
  if (pathname.startsWith("/cities")) return "Cities We Serve";
  if (pathname.startsWith("/partners")) return "Join as Partner";
  if (pathname.startsWith("/coming-soon")) return "Coming Soon";
  return "Repair Series";
}

function getFallbackBackRoute(pathname: string): string {
  if (pathname.startsWith("/cart/checkout")) return "/cart";
  if (pathname.startsWith("/services/")) return "/services";
  if (pathname.startsWith("/categories/")) return "/categories";
  if (pathname.startsWith("/category/")) return "/categories";
  if (pathname.startsWith("/dashboard/bookings/")) return "/dashboard/bookings";
  if (pathname.startsWith("/dashboard/")) return "/dashboard";
  if (pathname.startsWith("/book/")) return "/services";
  return "/";
}

/**
 * Mobile-only app bar header for subpages (< md).
 * Home page ("/") renders its own app shell with location picker.
 * On desktop (>= md), this component renders null and SiteHeader is used.
 */
export function MobileAppHeader() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { itemCount } = useCart();

  // On home, location landing pages, dev tools, or dedicated Wall Panels studio screens, mobile app header is not shown
  if (
    pathname === "/" ||
    pathname.startsWith("/dev") ||
    pathname.startsWith("/wall-panel") ||
    pathname.startsWith("/service-areas")
  ) {
    return null;
  }

  const title = getPageTitle(pathname);
  const isCartScreen = pathname.startsWith("/cart");
  const isCheckoutScreen = pathname.startsWith("/cart/checkout");

  const handleBack = () => {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      router.back();
    } else {
      router.push(getFallbackBackRoute(pathname));
    }
  };

  return (
    <header
      className="sticky top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top,0px))] items-center justify-between border-b border-[#E8E4E0] bg-white/95 px-2 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md md:hidden"
      aria-label="Mobile application header"
    >
      <div className="flex items-center gap-1 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex size-11 items-center justify-center rounded-full text-[#1A1A1A] transition-transform active:scale-90 active:bg-black/5"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate text-base font-bold tracking-tight text-[#0a0f1c]">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center pr-1">
        {isCheckoutScreen ? null : isCartScreen ? (
          <Link
            href="/search"
            aria-label="Search services"
            className="flex size-11 items-center justify-center rounded-full text-[#1A1A1A] transition-transform active:scale-90 active:bg-black/5"
          >
            <Search className="size-5" />
          </Link>
        ) : (
          <Link
            href="/cart"
            aria-label={`Cart, ${itemCount} items`}
            className="relative flex size-11 items-center justify-center rounded-full text-[#1A1A1A] transition-transform active:scale-90 active:bg-black/5"
          >
            <ShoppingCart className="size-5" />
            {itemCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#C86A37] px-1 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50 duration-200">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </Link>
        )}
      </div>
    </header>
  );
}
