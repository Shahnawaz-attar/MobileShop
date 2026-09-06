"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Search, Check, X, ChevronDown } from "lucide-react";

export interface MultiSelectOption {
  id: string;
  label: string;
  /** Optional secondary text (e.g. brand name for a product). */
  hint?: string;
}

interface SearchableMultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

/**
 * A searchable multi-select dropdown (theme-aware for the admin panel).
 * Type to filter, click to toggle; selected items show as removable chips.
 */
export function SearchableMultiSelect({
  label,
  options,
  selectedIds,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches",
  disabled = false,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "Enter" && document.activeElement === searchRef.current) {
        e.preventDefault();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reset query when opening.
  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.hint ?? "").toLowerCase().includes(q)
    );
  }, [options, query]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((s) => s !== id));
  };

  const selectedLabels = useMemo(() => {
    const byId = new Map(options.map((o) => [o.id, o.label]));
    return selectedIds.map((id) => ({ id, label: byId.get(id) ?? id }));
  }, [options, selectedIds]);

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>

      {/* Selected chips */}
      {selectedLabels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedLabels.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              {s.label}
              <button
                type="button"
                onClick={() => remove(s.id)}
                disabled={disabled}
                aria-label={`Remove ${s.label}`}
                className="rounded-full text-primary hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger + dropdown */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground disabled:opacity-50"
      >
        <span className={selectedIds.length ? "font-medium" : "text-muted-foreground"}>
          {selectedIds.length ? `${selectedIds.length} selected` : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((o) => {
                const checked = selectedIds.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(o.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{o.label}</span>
                      {o.hint && <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
