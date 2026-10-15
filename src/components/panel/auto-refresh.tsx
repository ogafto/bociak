"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Odświeża dane strony co kilka sekund – status bota i logi zmienia runner w tle.
export function AutoRefresh({ every = 5000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => clearInterval(id);
  }, [router, every]);
  return null;
}
