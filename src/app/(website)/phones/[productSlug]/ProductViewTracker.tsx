"use client";

import { useEffect, useRef } from "react";
import { trackEventAction } from "@/server/modules/analytics/actions";

interface ProductViewTrackerProps {
  productId: string;
}

export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per component mount (strict mode double-mount safe)
    if (!tracked.current) {
      tracked.current = true;
      trackEventAction({ type: "PRODUCT_VIEW", productId });
    }
  }, [productId]);

  return null;
}
