"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type {
  HomeBannerDoc,
  BannerAnimationType,
  BannerTextShadow,
  BannerElementOrder,
} from "@/lib/home-sections/resolve";

export type DynamicBannerSlideProps = {
  banner: HomeBannerDoc;
  deviceMode?: "desktop" | "tablet" | "mobile" | "auto";
  className?: string;
  style?: React.CSSProperties;
  replayKey?: string | number;
  priority?: boolean;
  onButtonClick?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  showButton?: boolean;
};

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return `rgba(0,0,0,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const TEXT_SHADOWS: Record<BannerTextShadow, string> = {
  none: "none",
  subtle: "0 1px 3px rgba(0,0,0,0.5)",
  medium: "0 2px 6px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.5)",
  strong: "0 4px 14px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.85)",
  glow: "0 0 12px rgba(255,255,255,0.7), 0 2px 6px rgba(0,0,0,0.9)",
};

const ANIMATION_NAMES: Record<BannerAnimationType, string> = {
  none: "none",
  slideUp: "dynBannerSlideUp",
  slideDown: "dynBannerSlideDown",
  slideLeft: "dynBannerSlideLeft",
  slideRight: "dynBannerSlideRight",
  fadeIn: "dynBannerFadeIn",
};

export function DynamicBannerSlide({
  banner,
  deviceMode = "auto",
  className = "",
  style = {},
  replayKey,
  priority = false,
  onButtonClick,
  onClick,
  showButton = true,
}: DynamicBannerSlideProps) {
  const styling = banner.styling || {};
  const overlay = banner.overlay || {
    enabled: true,
    color: "#000000",
    opacity: 45,
    gradientDirection: "to-r",
    gradientIntensity: 70,
    backdropBlur: false,
  };
  const animations = banner.animations || {
    title: "slideUp",
    tagline: "slideUp",
    button: "fadeIn",
    duration: 0.6,
    stagger: 0.15,
  };
  const responsive = banner.responsive || {};

  // Resolve active device settings for explicit device modes (e.g. preview) or auto defaults
  const activeSettings = useMemo(() => {
    if (deviceMode === "desktop") {
      return {
        titleSize: responsive.desktop?.titleSize ?? 32,
        taglineSize: responsive.desktop?.taglineSize ?? 16,
        position: responsive.desktop?.position ?? banner.contentPosition ?? "left",
        verticalAlign: responsive.desktop?.verticalAlign ?? banner.contentVerticalAlign ?? "center",
        maxWidth: responsive.desktop?.maxWidth ?? styling.maxWidth ?? 650,
        buttonSize: responsive.desktop?.buttonSize ?? "md",
      };
    }
    if (deviceMode === "tablet") {
      return {
        titleSize: responsive.tablet?.titleSize ?? 26,
        taglineSize: responsive.tablet?.taglineSize ?? 14,
        position: responsive.tablet?.position ?? banner.contentPosition ?? "left",
        verticalAlign: responsive.tablet?.verticalAlign ?? banner.contentVerticalAlign ?? "center",
        maxWidth: responsive.tablet?.maxWidth ?? styling.maxWidth ?? 500,
        buttonSize: responsive.tablet?.buttonSize ?? "md",
      };
    }
    if (deviceMode === "mobile") {
      return {
        titleSize: responsive.mobile?.titleSize ?? 20,
        taglineSize: responsive.mobile?.taglineSize ?? 13,
        position: responsive.mobile?.position ?? "center",
        verticalAlign: responsive.mobile?.verticalAlign ?? "center",
        maxWidth: responsive.mobile?.maxWidth ?? 340,
        buttonSize: responsive.mobile?.buttonSize ?? "sm",
      };
    }
    return null;
  }, [deviceMode, responsive, banner.contentPosition, banner.contentVerticalAlign, styling.maxWidth]);

  // Determine background image based on platform / device
  const bgImage = useMemo(() => {
    if (deviceMode === "mobile") {
      return banner.mobileImage || banner.image || banner.imageUrl || banner.websiteImage || "";
    }
    return banner.websiteImage || banner.image || banner.imageUrl || banner.mobileImage || "";
  }, [banner, deviceMode]);

  // Calculate overlay background style
  const overlayStyle = useMemo<React.CSSProperties>(() => {
    if (overlay.enabled === false) return { display: "none" };
    const color = overlay.color || "#000000";
    const opacity = (overlay.opacity ?? 45) / 100;
    const intensity = (overlay.gradientIntensity ?? 70) / 100;
    const direction = overlay.gradientDirection || "to-r";

    let bg = hexToRgba(color, opacity);
    if (direction !== "none") {
      const edgeOpacity = Math.max(0, opacity * (1 - intensity));
      const start = hexToRgba(color, opacity);
      const end = hexToRgba(color, edgeOpacity);

      switch (direction) {
        case "to-r":
          bg = `linear-gradient(to right, ${start} 0%, ${end} 100%)`;
          break;
        case "to-l":
          bg = `linear-gradient(to left, ${start} 0%, ${end} 100%)`;
          break;
        case "to-t":
          bg = `linear-gradient(to top, ${start} 0%, ${end} 100%)`;
          break;
        case "to-b":
          bg = `linear-gradient(to bottom, ${start} 0%, ${end} 100%)`;
          break;
        case "to-br":
          bg = `linear-gradient(to bottom right, ${start} 0%, ${end} 100%)`;
          break;
        case "to-tr":
          bg = `linear-gradient(to top right, ${start} 0%, ${end} 100%)`;
          break;
        case "radial":
          bg = `radial-gradient(circle at center, ${end} 0%, ${start} 100%)`;
          break;
        default:
          bg = hexToRgba(color, opacity);
      }
    }

    return {
      background: bg,
      backdropFilter: overlay.backdropBlur ? "blur(6px)" : undefined,
      WebkitBackdropFilter: overlay.backdropBlur ? "blur(6px)" : undefined,
    };
  }, [overlay]);

  // Animation values
  const duration = animations.duration ?? 0.6;
  const stagger = animations.stagger ?? 0.15;

  const elementOrder: BannerElementOrder[] = useMemo(() => {
    if (Array.isArray(banner.elementOrder) && banner.elementOrder.length > 0) {
      return banner.elementOrder;
    }
    return ["title", "tagline", "button"];
  }, [banner.elementOrder]);

  const hasOverlayContent = Boolean(
    banner.title || banner.tagline || (showButton && (banner.buttonText || banner.redirectLink))
  );

  // Fallback href
  const action = String(banner.clickAction || "").trim();
  const href =
    action === "serviceType" && banner.serviceTypeId
      ? `/services?type=${banner.serviceTypeId}`
      : banner.buttonLink || banner.redirectLink || "";

  // Render individual content elements
  const renderElement = (type: BannerElementOrder, index: number) => {
    const delay = `${index * stagger}s`;
    const animType = animations[type] || "none";
    const animName = ANIMATION_NAMES[animType];
    const animStyle: React.CSSProperties =
      animName !== "none"
        ? {
            animationName: animName,
            animationDuration: `${duration}s`,
            animationDelay: delay,
            animationFillMode: "both",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }
        : {};

    if (type === "title" && banner.title) {
      const shadow = TEXT_SHADOWS[styling.titleShadow || "medium"];
      const outline = styling.titleOutline
        ? { WebkitTextStroke: "1px rgba(0,0,0,0.85)", paintOrder: "stroke fill" }
        : {};

      return (
        <h2
          key={`title-${index}`}
          className={`font-black tracking-tight leading-tight transition-all duration-300 ${
            activeSettings ? "" : "text-xl sm:text-2xl md:text-3xl lg:text-4xl"
          }`}
          style={{
            color: styling.titleColor || "#FFFFFF",
            fontWeight: styling.titleWeight || "800",
            lineHeight:
              styling.titleLineHeight === "tight"
                ? "1.15"
                : styling.titleLineHeight === "relaxed"
                ? "1.4"
                : "1.25",
            textShadow: shadow,
            fontSize: activeSettings ? `${activeSettings.titleSize}px` : undefined,
            ...outline,
            ...animStyle,
          }}
        >
          {banner.title}
        </h2>
      );
    }

    if (type === "tagline" && banner.tagline) {
      const shadow = TEXT_SHADOWS[styling.taglineShadow || "subtle"];
      const outline = styling.taglineOutline
        ? { WebkitTextStroke: "0.5px rgba(0,0,0,0.8)", paintOrder: "stroke fill" }
        : {};

      return (
        <p
          key={`tagline-${index}`}
          className={`font-medium transition-all duration-300 ${
            activeSettings ? "" : "text-xs sm:text-sm md:text-base"
          }`}
          style={{
            color: styling.taglineColor || "#F3F4F6",
            fontWeight: styling.taglineWeight || "500",
            lineHeight:
              styling.taglineLineHeight === "tight"
                ? "1.2"
                : styling.taglineLineHeight === "relaxed"
                ? "1.6"
                : "1.4",
            textShadow: shadow,
            fontSize: activeSettings ? `${activeSettings.taglineSize}px` : undefined,
            ...outline,
            ...animStyle,
          }}
        >
          {banner.tagline}
        </p>
      );
    }

    if (type === "button" && showButton && (banner.buttonText || href)) {
      const btnText = banner.buttonText || "Explore Now";
      const btnRadius = styling.buttonRadius || "rounded-xl";
      const isSmall = activeSettings?.buttonSize === "sm";
      const isLarge = activeSettings?.buttonSize === "lg";

      const btnClasses = `inline-flex items-center gap-1.5 font-bold transition-all shadow-md active:scale-95 ${btnRadius} ${
        isSmall
          ? "px-3 py-1.5 text-xs"
          : isLarge
          ? "px-6 py-3 text-base"
          : "px-4 py-2 text-xs sm:text-sm"
      }`;

      const btnContent = (
        <span
          className={btnClasses}
          style={{
            backgroundColor: styling.buttonBgColor || "#C86A37",
            color: styling.buttonTextColor || "#FFFFFF",
          }}
          onClick={onButtonClick}
        >
          <span>{btnText}</span>
          <ArrowRight className="size-3.5 sm:size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      );

      if (href && !onButtonClick) {
        const isExternal = href.startsWith("http");
        return (
          <div key={`button-${index}`} style={animStyle} className="pt-1">
            {isExternal ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-block"
              >
                {btnContent}
              </a>
            ) : (
              <Link href={href} className="group inline-block">
                {btnContent}
              </Link>
            )}
          </div>
        );
      }

      return (
        <div key={`button-${index}`} style={animStyle} className="pt-1">
          <button type="button" className="group inline-block cursor-pointer">
            {btnContent}
          </button>
        </div>
      );
    }

    return null;
  };

  // Determine layout classes
  const hPos = activeSettings?.position ?? banner.contentPosition ?? "left";
  const vPos = activeSettings?.verticalAlign ?? banner.contentVerticalAlign ?? "center";

  const hAlignClass =
    hPos === "center"
      ? "items-center text-center mx-auto"
      : hPos === "right"
      ? "items-end text-right ml-auto"
      : "items-start text-left mr-auto";

  const vAlignClass =
    vPos === "top"
      ? "justify-start pt-6 sm:pt-8"
      : vPos === "bottom"
      ? "justify-end pb-6 sm:pb-8"
      : "justify-center";

  return (
    <div
      key={replayKey}
      onClick={onClick}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={style}
    >
      <style>{`
        @keyframes dynBannerSlideUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dynBannerSlideDown {
          from { opacity: 0; transform: translateY(-22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dynBannerSlideLeft {
          from { opacity: 0; transform: translateX(22px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes dynBannerSlideRight {
          from { opacity: 0; transform: translateX(-22px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes dynBannerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Background Banner Image */}
      {bgImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgImage}
          alt={banner.title || "Promotional Banner"}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0A0F1C]" />
      )}

      {/* Overlay Layer */}
      {hasOverlayContent && overlay.enabled !== false ? (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={overlayStyle}
        />
      ) : null}

      {/* Content Overlay */}
      {hasOverlayContent ? (
        <div
          className={`relative z-10 size-full flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 ${vAlignClass}`}
        >
          <div
            className={`flex flex-col ${hAlignClass} transition-all duration-300`}
            style={{
              gap: `${styling.contentGap ?? 12}px`,
              maxWidth: activeSettings?.maxWidth
                ? `${activeSettings.maxWidth}px`
                : styling.maxWidth
                ? `${styling.maxWidth}px`
                : "650px",
              width: "100%",
            }}
          >
            {elementOrder.map((elemType, idx) => renderElement(elemType, idx))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
