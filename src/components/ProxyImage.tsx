"use client";

import Image from "next/image";
import { useState } from "react";

interface ProxyImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none";
}

// Domains that are known to block hotlinks — always proxy these
const ALWAYS_PROXY_DOMAINS = [
  "promoplace.com",
  "ws.dll",
  "4imprint.com",
  "imprintresources.com",
  "rushordertees.com",
  "amsterdamprinting.com",
  "branders.com",
  "visionline.com",
];

// Domains served from CDN that don't need proxying
const SKIP_PROXY_DOMAINS = [
  "cloudinary.com",
  "imgix.net",
  "images.unsplash.com",
  "cdn.shopify.com",
  "res.cloudinary.com",
  "imagedelivery.net",
];

function shouldProxy(src: string): boolean {
  try {
    const { hostname } = new URL(src);

    if (SKIP_PROXY_DOMAINS.some((d) => hostname.includes(d))) return false;
    if (ALWAYS_PROXY_DOMAINS.some((d) => hostname.includes(d))) return true;

    return true;
  } catch {
    return false;
  }
}

function buildProxyUrl(src: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(src)}`;
}

export default function ProxyImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  sizes,
  priority = false,
  objectFit = "contain",
}: ProxyImageProps) {
  const [triedProxy, setTriedProxy] = useState(false);

  // Don't render anything if src is missing
  if (!src) return null;

  const resolvedSrc =
    shouldProxy(src) && !triedProxy ? buildProxyUrl(src) : src;

  const handleError = () => {
    if (!triedProxy && shouldProxy(src)) {
      // If proxy fails, try original URL
      setTriedProxy(true);
    }
  };

  const imageStyle =
    objectFit !== "contain"
      ? { objectFit: objectFit as React.CSSProperties["objectFit"] }
      : undefined;

  if (fill) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
        className={className}
        style={{ objectFit, ...imageStyle }}
        onError={handleError}
        priority={priority}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width ?? 300}
      height={height ?? 300}
      className={className}
      style={imageStyle}
      onError={handleError}
      priority={priority}
      unoptimized
    />
  );
}