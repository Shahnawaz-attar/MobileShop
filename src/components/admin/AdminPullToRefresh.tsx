"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AdminPullToRefreshProps {
  children: ReactNode;
}

const PULL_THRESHOLD = 80; // px of downward drag to trigger refresh

/**
 * Native Android-style pull-to-refresh for the admin dashboard.
 * Drag down at the top of the page to re-fetch the current list from the DB.
 * Uses router.refresh() so server components re-query the database.
 */
export function AdminPullToRefresh({ children }: AdminPullToRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pull, setPull] = useState(0); // current drag distance
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  const doRefresh = () => {
    setRefreshing(true);
    setPull(0);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setRefreshing(false), 800);
    });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    // Only start pull if we're at the very top of the page
    if (window.scrollY <= 0) {
      startY.current = e.touches[0]?.clientY ?? null;
      pulling.current = true;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || startY.current === null) return;
    const y = e.touches[0]?.clientY ?? startY.current;
    const delta = y - startY.current;
    if (delta > 0) {
      // dampen the pull so it feels natural
      setPull(Math.min(delta * 0.5, 120));
    } else {
      setPull(0);
    }
  };

  const onTouchEnd = () => {
    if (pulling.current && pull >= PULL_THRESHOLD) {
      doRefresh();
    } else {
      setPull(0);
    }
    startY.current = null;
    pulling.current = false;
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className="relative min-h-full"
    >
      {/* Pull / refresh indicator */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex justify-center"
        style={{
          transform: `translateY(${pull - 56}px)`,
          opacity: pull > 0 ? 1 : 0,
          transition: refreshing ? "transform 0.2s ease" : "none",
        }}
        aria-hidden
      >
        <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-md">
          <Loader2 className={`h-5 w-5 text-foreground ${pull >= PULL_THRESHOLD || refreshing ? "animate-spin" : ""}`} />
        </div>
      </div>

      {/* Content nudged down while pulling */}
      <div style={{ transform: `translateY(${pull}px)`, transition: refreshing ? "transform 0.2s ease" : "none" }}>
        {children}
      </div>
    </div>
  );
}
