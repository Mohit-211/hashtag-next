import { NextRequest, NextResponse } from "next/server";
import { fetchPublicUrl, readBody, ResponseTooLargeError, UnsafeTargetError } from "@/lib/ssrfSafeFetch";

const MAX_URL_LENGTH = 2048;

const ALLOWED_IMAGE_HOSTS: ReadonlySet<string> = new Set([
  "node.hashtagbillionaire.com",
  "www.promoplace.com",
  "cdnm.sanmar.com",
  "www.ssactivewear.com",
  "cdn.ssactivewear.com",
]);

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
  if (parsed.protocol !== "https:") {
    return new NextResponse("Only HTTPS URLs are allowed", { status: 400 });
  }

  try {
    const response = await fetchPublicUrl(parsed, {
      signal: AbortSignal.timeout(10_000),
      allowedHosts: ALLOWED_IMAGE_HOSTS,
      httpsOnly: true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ImageProxy/1.0)",
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
    if (err instanceof ResponseTooLargeError) {
      // SEC-002: nothing past the cap is read into memory.
      return new NextResponse("Upstream image is too large", { status: 502 });
    }
    console.error("[proxy-image] fetch failed:", err);
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}