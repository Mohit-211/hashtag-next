import { NextRequest, NextResponse } from "next/server";
import { fetchPublicUrl, readBody, UnsafeTargetError } from "@/lib/ssrfSafeFetch";

const MAX_URL_LENGTH = 2048;

// This proxy has no allowlist of trusted image hosts (supplier images come
// from many domains), so every fetch goes through fetchPublicUrl. It refuses
// any URL, DNS answer or redirect that leads to loopback, private, link-local
// or other non-public addresses, and connects only to the validated IP, so
// the server can't be used to reach internal-network resources (SEC-001).

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

  try {
    const response = await fetchPublicUrl(parsed, {
      // A slow supplier host must not hang the customization canvas for minutes.
      signal: AbortSignal.timeout(10_000),
      headers: {
        // Forward a browser-like UA so servers don't block the request
        "User-Agent":
          "Mozilla/5.0 (compatible; ImageProxy/1.0)",
        // The rest are the headers fetch() used to send, so supplier CDNs and
        // their bot filters still see the same request as before.
        Accept: "*/*",
        "Accept-Language": "*",
        "Sec-Fetch-Mode": "cors",
        "Accept-Encoding": "gzip, deflate",
      },
    });
    const status = response.statusCode ?? 502;

    if (status < 200 || status > 299) {
      response.destroy();
      return new NextResponse(`Upstream error: ${status}`, {
        status,
      });
    }

    const contentType = response.headers["content-type"] || "";
    // Only ever relay actual image bytes through this same-origin endpoint —
    // without this, an attacker-controlled URL could make it reflect
    // arbitrary content (e.g. text/html) under our own origin.
    if (!contentType.toLowerCase().startsWith("image/")) {
      response.destroy();
      return new NextResponse("Upstream response was not an image", { status: 400 });
    }

    const buffer = await readBody(response);

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
    if (err instanceof UnsafeTargetError) {
      // Generic message: don't tell the caller what an internal name resolved to.
      return new NextResponse("This host cannot be fetched", { status: 400 });
    }
    console.error("[proxy-image] fetch failed:", err);
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}