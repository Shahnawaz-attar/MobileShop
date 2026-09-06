"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type SelectOption = {
  label: string;
  value: string;
};

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Accessible dropdown select.
 *
 * The menu is rendered through a React portal to <body> so it is never clipped
 * or hidden by an ancestor's `overflow: hidden` (e.g. the public catalogue
 * header) and always paints above overlapping cards/content.
 */
export function CustomSelect({
  options,
  value,
  onChange,
  className,
  placeholder = "Select an option",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      // Ignore clicks inside the portaled menu itself.
      const menu = document.getElementById("custom-select-menu");
      if (menu?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  // Measure the button so the portaled menu can be positioned under it.
  useEffect(() => {
    if (!isOpen) return;
    const place = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setMenuRect({
        top: r.bottom + 8,
        left: r.left,
        width: Math.max(r.width, 220),
      });
    };
    place();
    // Reposition only on resize (keeps the menu pinned under the trigger).
    // NOTE: do NOT lock body scroll or re-measure on every scroll here — it
    // makes the page jump/shake when the menu opens.
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
    };
  }, [isOpen]);

  const toggle = () => {
    setIsOpen((v) => !v);
  };

  const selectOption = (value: string) => {
    onChange(value);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full text-left sm:w-auto", className)} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between gap-4 rounded-full border bg-white px-5 py-3 text-sm font-bold text-ink transition-all",
          isOpen
            ? "border-brand/50 shadow-md"
            : "border-border shadow-sm hover:border-border-strong hover:shadow-md"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <svg
          className={cn("h-4 w-4 shrink-0 text-ink-faint transition-transform duration-300", isOpen && "rotate-180")}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Portaled dropdown menu — escapes overflow/stacking ancestors */}
      {isOpen &&
        menuRect &&
        createPortal(
          <div
            id="custom-select-menu"
            role="listbox"
            className="fixed z-[120] origin-top-right rounded-2xl border border-border bg-white p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18)] animate-in fade-in-0 zoom-in-95"
            style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
          >
            <div className="flex flex-col gap-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => selectOption(option.value)}
                  className={cn(
                    "flex items-center w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors text-left",
                    option.value === value
                      ? "bg-brand/10 text-brand"
                      : "text-ink-soft hover:bg-surface-hover hover:text-ink"
                  )}
                >
                  {option.label}
                  {option.value === value && (
                    <svg className="ml-auto h-4 w-4 shrink-0 text-brand" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

