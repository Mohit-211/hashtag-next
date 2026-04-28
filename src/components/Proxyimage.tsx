// components/ui/ProxyImage.tsx
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
  fallback?: string; // optional custom fallback image path
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
  "imagedelivery.net", // Cloudflare Images
];

function shouldProxy(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    if (SKIP_PROXY_DOMAINS.some((d) => hostname.includes(d))) return false;
    if (ALWAYS_PROXY_DOMAINS.some((d) => hostname.includes(d))) return true;
    // Default: proxy all absolute external URLs
    return true;
  } catch {
    // Relative URL — no proxy needed
    return false;
  }
}

function buildProxyUrl(src: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(src)}`;
}

const DEFAULT_FALLBACK = "/images/placeholder-product.png";

export default function ProxyImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  sizes,
  priority = false,
  fallback = DEFAULT_FALLBACK,
  objectFit = "cover",
}: ProxyImageProps) {
  const [errored, setErrored] = useState(false);
  const [triedProxy, setTriedProxy] = useState(false);

  // ── Resolve final src ──────────────────────────────────────────────────
  let resolvedSrc: string;

  if (!src) {
    resolvedSrc = fallback;
  } else if (errored) {
    // If proxy also failed, fall through to static fallback
    resolvedSrc = fallback;
  } else if (shouldProxy(src) && !triedProxy) {
    resolvedSrc = buildProxyUrl(src);
  } else {
    resolvedSrc = src;
  }

  const handleError = () => {
    if (!triedProxy && src && shouldProxy(src)) {
      // First failure: try direct (maybe proxy had an issue)
      setTriedProxy(true);
    } else {
      // Both failed: show fallback
      setErrored(true);
    }
  };

  const imageStyle =
    objectFit !== "cover"
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
        style={{ objectFit: objectFit, ...imageStyle }}
        onError={handleError}
        priority={priority}
        unoptimized // skip Next.js image optimisation for proxied URLs
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