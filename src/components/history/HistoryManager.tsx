"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function HistoryManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentUrl =
      pathname + (searchParams.toString() ? `?${searchParams}` : "");

    // Ignore if already initialized for this URL
    const key = `history-${currentUrl}`;

    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "true");

    // If this is the first page opened in this tab
    if (window.history.state === null) {
      window.history.replaceState(
        { root: true },
        "",
        "/"
      );

      window.history.pushState(
        { page: currentUrl },
        "",
        currentUrl
      );
    }
  }, [pathname, searchParams]);

  return null;
}