"use client";

import { cn } from "@/lib/utils";

/**
 * Shared filter UI primitives.
 *
 * These use the shadcn SEMANTIC tokens (foreground, muted-foreground, border,
 * card, secondary, primary, ring) which invert correctly between the light
 * public storefront (:root) and the dark admin (.dark). Do NOT use the fixed
 * light-only `ink` tokens here or the components will be illegible in admin.
 */

interface FilterCheckboxGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/** Section wrapper used inside filter panels (sidebar, drawer, admin list). */
export function FilterCheckboxGroup({ title, children, className }: FilterCheckboxGroupProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{title}</h3>
      {children}
    </div>
  );
}

interface FilterCheckboxRowProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

/** A single row: custom checkbox + label. Used for brand / condition lists. */
export function FilterCheckboxRow({ label, checked, onToggle }: FilterCheckboxRowProps) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-secondary/60">
      <CheckboxIcon checked={checked} onToggle={onToggle} />
      <span className="flex-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {label}
      </span>
    </label>
  );
}

interface CheckboxIconProps {
  checked: boolean;
  onToggle: () => void;
}

/** The visual checkbox (input + check svg). Shared by row & chip styles. */
function CheckboxIcon({ checked, onToggle }: CheckboxIconProps) {
  return (
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        className="peer h-5 w-5 appearance-none rounded-md border border-border bg-card transition-all checked:border-primary checked:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        checked={checked}
        onChange={onToggle}
      />
      <svg
        className="pointer-events-none absolute h-3.5 w-3.5 stroke-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

interface FilterChipRowProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

/** A labelled chip group — used for storage sizes. */
export function FilterChipRow({ title, className, children }: FilterChipRowProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

/** A single toggle chip (storage size etc.). */
export function FilterChip({ label, checked, onToggle }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        "inline-flex h-9 min-w-[3.5rem] items-center justify-center rounded-full border px-3 text-sm font-bold transition-all",
        checked
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
