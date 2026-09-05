"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { AutocompleteSearch } from "@/components/shared/AutocompleteSearch";
import { Menu, X } from "lucide-react";

interface PublicNavbarProps {
  shopName: string;
  logoUrl: string | null;
}

export function PublicNavbar({ shopName, logoUrl }: PublicNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href="/" className="group flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={shopName}
                className="h-9 w-9 shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-border transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-ink text-base text-white shadow-sm sm:h-10 sm:w-10">
                📱
              </span>
            )}
            <span className="truncate text-[17px] font-black tracking-tight text-ink sm:text-lg">
              {shopName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: "/phones", label: "All Devices" },
              { href: "/phones?brands=apple", label: "iPhones" },
              { href: "/phones?brands=samsung", label: "Samsung" },
              { href: "/about", label: "About" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden w-64 lg:block xl:w-72">
              <Suspense fallback={<div className="h-10 animate-pulse rounded-full bg-surface-hover" />}>
                <AutocompleteSearch placeholder="Search devices…" compact />
              </Suspense>
            </div>

            <Link href="/phones" className="btn-dark hidden !min-h-0 px-5 py-2.5 text-sm sm:inline-flex">
              Shop Now
            </Link>

            <button
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:bg-surface-hover md:hidden"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu — bottom-sheet drawer (thumb-friendly) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Scrim */}
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          />
          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-t border-border bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />

            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt={shopName} className="h-9 w-9 rounded-2xl object-cover shadow-sm" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ink text-sm text-white">📱</span>
                )}
                <span className="text-lg font-black tracking-tight text-ink">{shopName}</span>
              </span>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-hover text-ink transition-colors hover:bg-border"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5">
              <Suspense fallback={<div className="h-12 animate-pulse rounded-2xl bg-surface-hover" />}>
                <AutocompleteSearch
                  placeholder="Search devices…"
                  onNavigate={() => setIsMenuOpen(false)}
                />
              </Suspense>
            </div>

            <nav className="mb-5 flex flex-col gap-1">
              {[
                { href: "/phones", label: "All Devices", icon: "📱" },
                { href: "/phones?brands=apple", label: "Apple iPhones" },
                { href: "/phones?brands=samsung", label: "Samsung Galaxy" },
                { href: "/about", label: "About" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="group flex min-h-[52px] items-center justify-between rounded-2xl px-4 py-3 text-lg font-bold text-ink transition-colors hover:bg-surface-hover active:bg-border"
                >
                  <span className="flex items-center gap-3">
                    {item.icon && <span className="text-lg">{item.icon}</span>}
                    {item.label}
                  </span>
                  <span className="text-ink-faint transition-transform group-hover:translate-x-1">&rarr;</span>
                </Link>
              ))}
            </nav>

            <Link
              href="/phones"
              onClick={() => setIsMenuOpen(false)}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 text-base font-bold text-white transition-all active:scale-[0.98]"
            >
              Shop Now
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
