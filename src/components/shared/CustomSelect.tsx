"use client";

import { useState, useRef, useEffect } from "react";
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

export function CustomSelect({
  options,
  value,
  onChange,
  className,
  placeholder = "Select an option",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={cn("relative inline-block w-full sm:w-auto text-left", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Dropdown Menu */}
      <div
        className={cn(
          "absolute right-0 z-50 mt-2 w-full min-w-[220px] origin-top-right rounded-2xl border border-border bg-white p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-200",
          isOpen
            ? "scale-100 opacity-100 visible translate-y-0"
            : "scale-95 opacity-0 invisible -translate-y-2 pointer-events-none"
        )}
      >
        <div className="flex flex-col gap-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
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
      </div>
    </div>
  );
}
