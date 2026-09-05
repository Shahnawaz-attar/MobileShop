"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function isInternalNavigation(href: string, pathname: string): boolean {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return false;
    return url.pathname + url.search !== pathname;
  } catch {
    return false;
  }
}

export function RouteChangeLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    const start = (target: EventTarget | null) => {
      const anchor = (target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || !isInternalNavigation(href, pathnameRef.current)) return;
      setActive(true);
    };

    const onClick = (e: MouseEvent) => start(e.target);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      start(e.target);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(() => setActive(false), 12000);
    return () => window.clearTimeout(timeout);
  }, [active]);

  if (!active) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[200] h-[3px] overflow-hidden bg-slate-200/60"
        role="progressbar"
        aria-label="Loading page"
        aria-busy="true"
      >
        <div className="route-progress-bar h-full w-2/5 bg-slate-900" />
      </div>
      <div
        className="fixed inset-0 z-[199] flex items-center justify-center bg-white/50 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none pointer-events-none"
        aria-hidden
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/95 px-6 py-5 shadow-lg ring-1 ring-slate-200/80 lg:hidden">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-slate-900" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Loading</p>
        </div>
      </div>
    </>
  );
}
