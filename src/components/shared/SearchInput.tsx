"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  defaultValue?: string;
  targetPath?: string;
  className?: string;
  placeholder?: string;
  /** Called after a search navigation is triggered (e.g. close a mobile menu). */
  onNavigate?: () => void;
  /**
   * When true, search only fires on the search button/Enter key (no live
   * debounced search). Use inside the mobile menu so typing doesn't close it.
   */
  submitOnAction?: boolean;
}

export function SearchInput({
  defaultValue = "",
  targetPath = "/phones",
  className,
  placeholder = "Search phones, brands, specs...",
  onNavigate,
  submitOnAction = false,
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(defaultValue || currentQ);

  const initialRender = useRef(true);

  // Sync internal state if URL search param changes from elsewhere
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Navigate to the search results for the current query.
  const runSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        params.set("q", q.trim());
      } else {
        params.delete("q");
      }
      // Use replace to avoid filling up the history stack on every keystroke
      // scroll: false prevents jumping to the top of the page on typing
      router.replace(`${targetPath}?${params.toString()}`, { scroll: false });
      onNavigate?.();
    },
    [searchParams, targetPath, onNavigate]
  );

  // Live debounced search (only when NOT in submitOnAction mode)
  useEffect(() => {
    if (submitOnAction) return;
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const currentQ = searchParams.get("q") || "";
    if (query === currentQ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      runSearch(query);
    }, 400); // 400ms debounce for smoother typing

    return () => clearTimeout(timeoutId);
  }, [query, searchParams, runSearch, submitOnAction]);

  const handleSubmit = () => {
    runSearch(query);
  };

  return (
    <div className={cn("relative", className)}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (submitOnAction && e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-full border border-border bg-white py-2.5 text-sm font-semibold text-ink placeholder:text-ink-faint transition-colors duration-300 hover:bg-surface-hover focus:border-border focus:bg-white focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
          submitOnAction ? "pl-4 pr-14" : "pl-11"
        )}
      />
      {submitOnAction ? (
        // Search button (mobile menu) — only searches when tapped
        <button
          type="button"
          onClick={handleSubmit}
          aria-label="Search"
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-white transition-transform hover:scale-105 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      ) : (
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
          xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      )}
    </div>
  );
}
