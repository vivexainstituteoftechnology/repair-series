"use client";

import NextImage, { type ImageProps } from "next/image";

function isGifUrl(src: string): boolean {
  if (!src) return false;
  const clean = src.split("?")[0].toLowerCase();
  return clean.endsWith(".gif") || src.toLowerCase().includes(".gif?") || src.toLowerCase().includes("format=gif");
}

function optimizedSrc(src: string): string {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) return src;
  if (isGifUrl(src)) return src;
  if (/\/upload\/(?:[^/]*f_auto|,f_auto)/.test(src)) return src;
  return src.replace("/upload/", "/upload/f_auto,q_auto/");
}

function isOptimizedHost(src: string): boolean {
  return Boolean(src) && src.includes("res.cloudinary.com");
}

/** next/image for Cloudinary (with unoptimized for animated GIFs); plain img for other hosts. */
export function RemoteImage({ src, alt, className, fill, unoptimized, ...rest }: ImageProps) {
  const url = typeof src === "string" ? src : "";
  const isGif = isGifUrl(url);

  if (isOptimizedHost(url)) {
    return (
      <NextImage
        src={optimizedSrc(url)}
        alt={alt}
        className={className}
        fill={fill}
        unoptimized={unoptimized || isGif}
        {...rest}
      />
    );
  }
  return (
    <img
      src={url}
      alt={alt || ""}
      className={className}
      style={
        fill
          ? { objectFit: "cover", position: "absolute", inset: 0, width: "100%", height: "100%" }
          : undefined
      }
    />
  );
}
