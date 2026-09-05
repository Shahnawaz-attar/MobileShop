"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
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
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/70 backdrop-blur-2xl transition-all duration-300 shadow-[0_4px_30px_rgb(0,0,0,0.02)]">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 lg:gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            {logoUrl ? (
              <img src={logoUrl} alt={shopName} className="h-10 w-10 sm:h-11 sm:w-11 rounded-[14px] object-cover shadow-[0_8px_20px_rgb(0,0,0,0.1)] transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-[14px] bg-slate-900 text-xl shadow-[0_8px_20px_rgb(0,0,0,0.1)] transition-transform duration-300 group-hover:scale-105">📱</span>
            )}
            <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              {shopName}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link href="/phones" className="text-sm font-bold text-slate-500 transition-all hover:text-slate-900 hover:-translate-y-0.5">
              All Devices
            </Link>
            <Link href="/about" className="text-sm font-bold text-slate-500 transition-all hover:text-slate-900 hover:-translate-y-0.5">
              About
            </Link>
            <Link href="/phones?brands=apple" className="text-sm font-bold text-slate-500 transition-all hover:text-slate-900 hover:-translate-y-0.5">
              iPhones
            </Link>
            <Link href="/phones?brands=samsung" className="text-sm font-bold text-slate-500 transition-all hover:text-slate-900 hover:-translate-y-0.5">
              Samsung
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden lg:block w-72">
            <Suspense fallback={<div className="h-10 animate-pulse rounded-full bg-slate-100" />}>
              <SearchInput placeholder="Search devices..." />
            </Suspense>
          </div>
          <Link
            href="/phones"
            className="hidden sm:inline-flex rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgb(0,0,0,0.12)] transition-all hover:bg-black hover:scale-105 hover:shadow-[0_8px_25px_rgb(0,0,0,0.18)]"
          >
            Shop Now
          </Link>
          
          <button 
            className="md:hidden flex items-center justify-center p-2 -mr-2 rounded-full text-black hover:bg-slate-100 transition-colors"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-3xl flex flex-col px-5 py-6 md:hidden overflow-y-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
              {logoUrl ? (
                <img src={logoUrl} alt={shopName} className="h-10 w-10 rounded-[12px] object-cover shadow-sm" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-900 text-white shadow-sm">📱</span>
              )}
              <span className="text-xl font-black tracking-tight text-slate-900 truncate max-w-[180px]">
                {shopName}
              </span>
            </Link>
            <button 
              className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-10 px-1">
            <Suspense fallback={<div className="h-14 animate-pulse rounded-full bg-slate-100" />}>
              <SearchInput placeholder="Search devices..." className="text-lg" />
            </Suspense>
          </div>

          <nav className="flex flex-col gap-2 px-2">
            <Link 
              href="/phones" 
              className="group flex items-center justify-between rounded-2xl p-4 text-2xl font-bold text-slate-900 hover:bg-slate-100 transition-all" 
              onClick={() => setIsMenuOpen(false)}
            >
              <span>All Devices</span>
              <span className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all">&rarr;</span>
            </Link>
            <Link 
              href="/about" 
              className="group flex items-center justify-between rounded-2xl p-4 text-2xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all" 
              onClick={() => setIsMenuOpen(false)}
            >
              <span>About</span>
              <span className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all">&rarr;</span>
            </Link>
            <Link 
              href="/phones?brands=apple" 
              className="group flex items-center justify-between rounded-2xl p-4 text-2xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all" 
              onClick={() => setIsMenuOpen(false)}
            >
              <span>Apple iPhones</span>
              <span className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all">&rarr;</span>
            </Link>
            <Link 
              href="/phones?brands=samsung" 
              className="group flex items-center justify-between rounded-2xl p-4 text-2xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all" 
              onClick={() => setIsMenuOpen(false)}
            >
              <span>Samsung Galaxy</span>
              <span className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all">&rarr;</span>
            </Link>
          </nav>
          
          <div className="mt-auto pt-8 px-2">
             <Link
              href="/phones"
              className="flex w-full items-center justify-center rounded-2xl bg-slate-900 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-black active:scale-[0.98]"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop Now
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
