import { NextRequest, NextResponse } from "next/server";

const MAX_URL_LENGTH = 2048;

// Blocks obvious SSRF targets: loopback, link-local (incl. the cloud
// metadata IP), and private RFC1918 ranges. Best-effort hostname/IP-literal
// check — this proxy has no allowlist of trusted image hosts, so without
// this a client could make the server fetch internal-network resources.
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "0.0.0.0" || host === "::1") return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
  }
  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing ?url= parameter", { status: 400 });
  }
  if (url.length > MAX_URL_LENGTH) {
    return new NextResponse("url parameter is too long", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new NextResponse("Only http/https URLs are allowed", { status: 400 });
  }
  if (isBlockedHost(parsed.hostname)) {
    return new NextResponse("This host cannot be fetched", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      // Forward a browser-like UA so servers don't block the request
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ImageProxy/1.0)",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "";
    // Only ever relay actual image bytes through this same-origin endpoint —
    // without this, an attacker-controlled URL could make it reflect
    // arbitrary content (e.g. text/html) under our own origin.
    if (!contentType.toLowerCase().startsWith("image/")) {
      return new NextResponse("Upstream response was not an image", { status: 400 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Allow the browser to use this response in a canvas
        "Access-Control-Allow-Origin": "*",
        // Cache for 24 h so you don't hammer upstream servers
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("[proxy-image] fetch failed:", err);
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}