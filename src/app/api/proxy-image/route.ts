// app/api/proxy-image/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing ?url= parameter", { status: 400 });
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

    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "image/jpeg";

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