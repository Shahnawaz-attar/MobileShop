"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  defaultValue?: string;
  targetPath?: string;
  className?: string;
  placeholder?: string;
  /** Called after a debounced search navigation is triggered (e.g. close a mobile menu). */
  onNavigate?: () => void;
}

export function SearchInput({ 
  defaultValue = "", 
  targetPath = "/phones",
  className,
  placeholder = "Search phones, brands, specs...",
  onNavigate,
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // If the URL changes (e.g. user clears filters), keep our local state in sync
  const currentQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(defaultValue || currentQ);
  
  const initialRender = useRef(true);

  // Sync internal state if URL search param changes from elsewhere
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const currentQ = searchParams.get("q") || "";
    if (query === currentQ) {
      // Prevent infinite loop if the query state already matches the URL
      return;
    }

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      // Use replace to avoid filling up the history stack on every keystroke
      // scroll: false prevents jumping to the top of the page on typing
      router.replace(`${targetPath}?${params.toString()}`, { scroll: false });
      onNavigate?.();
    }, 400); // 400ms debounce for smoother typing

    return () => clearTimeout(timeoutId);
  }, [query, router, searchParams, targetPath, onNavigate]);

  return (
    <div className={cn("relative group", className)}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-border bg-white px-5 py-2.5 pl-11 text-sm font-semibold text-ink placeholder:text-ink-faint transition-colors duration-300 hover:bg-surface-hover focus:border-border focus:bg-white focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
      />
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
        xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
    </div>
  );
}
