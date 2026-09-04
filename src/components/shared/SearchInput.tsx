"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  defaultValue?: string;
  targetPath?: string;
  className?: string;
  placeholder?: string;
}

export function SearchInput({ 
  defaultValue = "", 
  targetPath = "/phones",
  className,
  placeholder = "Search phones, brands, specs..."
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
    }, 400); // 400ms debounce for smoother typing

    return () => clearTimeout(timeoutId);
  }, [query, router, searchParams, targetPath]);

  return (
    <div className={cn("relative group", className)}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-slate-200/60 bg-slate-50/80 px-5 py-2.5 pl-11 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-transparent focus-visible:border-transparent focus:bg-white focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:bg-white"
      />
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
    </div>
  );
}
