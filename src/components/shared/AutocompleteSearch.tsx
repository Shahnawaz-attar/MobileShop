"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSuggestion {
  id: string;
  slug: string;
  title: string;
  deviceType: string;
  storageGb: number | null;
  pricePaise: number;
  brandName: string;
  imageUrl: string | null;
}
interface BrandSuggestion { id: string; name: string; slug: string }
interface ModelSuggestion { id: string; name: string; slug: string; brandName: string }
interface SuggestData {
  products: ProductSuggestion[];
  brands: BrandSuggestion[];
  models: ModelSuggestion[];
}

interface AutocompleteSearchProps {
  placeholder?: string;
  className?: string;
  /** Called when the user commits a search (e.g. close a mobile menu). */
  onNavigate?: () => void;
  /** Compact styling for the navbar (smaller height). */
  compact?: boolean;
  /** Large styling for the homepage hero search. */
  large?: boolean;
}

function formatINR(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

export function AutocompleteSearch({
  placeholder = "Search phones, brands…",
  className,
  onNavigate,
  compact = false,
  large = false,
}: AutocompleteSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggest, setSuggest] = useState<SuggestData>({ products: [], brands: [], models: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced fetch of suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 1) {
      setSuggest({ products: [], brands: [], models: [] });
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as SuggestData;
        setSuggest(data);
        setActive(-1);
        setOpen(true);
      } catch {
        setSuggest({ products: [], brands: [], models: [] });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  type FlatItem = {
    type: "product" | "brand" | "model";
    label: string;
    sub: string;
    href: string;
    image: string | null;
    price?: number;
  };

  const flatItems: FlatItem[] = [
    ...suggest.products.map((p) => ({
      type: "product" as const,
      label: p.title,
      sub: p.brandName + (p.storageGb ? ` · ${p.storageGb}GB` : ""),
      href: `/phones/${p.slug}`,
      image: p.imageUrl,
      price: p.pricePaise,
    })),
    ...suggest.brands.map((b) => ({ type: "brand" as const, label: b.name, sub: "Brand", href: `/phones?brands=${b.slug}`, image: null as string | null })),
    ...suggest.models.map((m) => ({ type: "model" as const, label: m.name, sub: m.brandName, href: `/phones?q=${encodeURIComponent(m.name)}`, image: null as string | null })),
  ];

  const goSearch = (q: string) => {
    setOpen(false);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/phones?${params.toString()}`);
    onNavigate?.();
  };

  const pick = (idx: number) => {
    const item = flatItems[idx];
    if (!item) return;
    setOpen(false);
    setQuery("");
    router.push(item.href);
    onNavigate?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(flatItems.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? flatItems.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && flatItems[active]) {
        pick(active);
      } else {
        goSearch(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && (flatItems.length > 0 || loading);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          className={cn(
            "w-full rounded-full border border-border bg-white pl-11 text-sm font-medium text-ink placeholder:text-ink-faint transition-colors hover:bg-surface-hover focus:border-border focus:outline-none focus-visible:outline-none",
            compact ? "h-10 pr-10" : large ? "h-12 pr-12 text-base" : "h-11 pr-10"
          )}
        />
        {loading && (
          <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-border-strong border-t-ink" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
          <ul className="max-h-80 overflow-y-auto py-1">
            {flatItems.map((item, i) => (
              <li key={`${item.type}-${item.label}-${i}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left",
                    active === i && "bg-surface-hover"
                  )}
                >
                  {item.type === "product" ? (
                    <>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-hover">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm">📱</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{item.label}</span>
                        <span className="block truncate text-xs text-ink-soft">{item.sub}</span>
                      </span>
                      {typeof item.price === "number" && (
                        <span className="shrink-0 text-sm font-bold text-ink">
                          {formatINR(item.price)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {item.type === "brand" ? "B" : "M"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{item.label}</span>
                        <span className="block truncate text-xs text-ink-soft">{item.sub}</span>
                      </span>
                    </>
                  )}
                </button>
              </li>
            ))}
            {flatItems.length === 0 && loading && (
              <li className="px-4 py-3 text-sm text-ink-soft">Searching…</li>
            )}
          </ul>

          {/* "Search for ..." footer */}
          {query.trim() && (
            <button
              type="button"
              onClick={() => goSearch(query)}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover"
            >
              <CornerDownLeft className="h-4 w-4 text-ink-faint" />
              Search for &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
