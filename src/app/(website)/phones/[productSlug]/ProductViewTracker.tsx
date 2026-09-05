"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/track-event";

interface ProductViewTrackerProps {
  productId: string;
}

const VISITOR_KEY = "ms_vid";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const tabKey = `ms_pv_${productId}`;
    if (sessionStorage.getItem(tabKey)) return;
    sessionStorage.setItem(tabKey, "1");

    trackEvent({
      type: "PRODUCT_VIEW",
      productId,
      visitorId: getVisitorId(),
    });
  }, [productId]);

  return null;
}
