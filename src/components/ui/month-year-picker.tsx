"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  BILL_MONTH_OPTIONS,
  billMonthYearOptions,
  formatBillMonthInput,
  formatBillMonthLabel,
  normalizeBillMonth,
  parseBillMonthInput,
} from "@/lib/bill-date";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface MonthYearPickerProps {
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
}

const triggerClass =
  "w-full rounded-xl border border-input/50 bg-background/50 px-4 py-3 text-sm font-medium text-left shadow-sm transition-all hover:border-input focus:border-primary focus:outline-none flex items-center justify-between";

function MonthYearPanel({
  draftMonth,
  draftYear,
  onMonthChange,
  onYearChange,
  onConfirm,
  onClear,
  confirmLabel = "Done",
}: {
  draftMonth: number | "";
  draftYear: number | "";
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onConfirm: () => void;
  onClear: () => void;
  confirmLabel?: string;
}) {
  const years = React.useMemo(() => billMonthYearOptions(), []);
  const canConfirm = Boolean(draftMonth && draftYear);

  return (
    <div className="w-full space-y-4">
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Month
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {BILL_MONTH_OPTIONS.map((month) => {
            const selected = draftMonth === month.value;
            return (
              <button
                key={month.value}
                type="button"
                onClick={() => onMonthChange(month.value)}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/50 bg-background text-foreground hover:border-input hover:bg-muted/50"
                )}
              >
                {month.label.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Year
        </p>
        <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
          {years.map((year) => {
            const selected = draftYear === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => onYearChange(year)}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/50 bg-background text-foreground hover:border-input hover:bg-muted/50"
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClear}>
          Clear
        </Button>
        <Button
          type="button"
          className="flex-1 rounded-xl"
          disabled={!canConfirm}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

export function MonthYearPicker({
  value,
  onChange,
  placeholder = "Pick bill month",
  className,
}: MonthYearPickerProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(false);
  const [draftMonth, setDraftMonth] = React.useState<number | "">("");
  const [draftYear, setDraftYear] = React.useState<number | "">("");

  const syncDraftFromValue = React.useCallback(() => {
    const monthValue = formatBillMonthInput(value);
    setDraftMonth(monthValue ? Number(monthValue.slice(5, 7)) : "");
    setDraftYear(monthValue ? Number(monthValue.slice(0, 4)) : "");
  }, [value]);

  const emitChange = React.useCallback(
    (month: number | "", year: number | "") => {
      if (!month || !year) {
        onChange?.(undefined);
        return;
      }

      const parsed = parseBillMonthInput(`${year}-${String(month).padStart(2, "0")}`);
      onChange?.(parsed ? normalizeBillMonth(parsed) : undefined);
    },
    [onChange]
  );

  const confirmSelection = React.useCallback(() => {
    emitChange(draftMonth, draftYear);
    setMobileOpen(false);
    setDesktopOpen(false);
  }, [draftMonth, draftYear, emitChange]);

  const clearSelection = React.useCallback(() => {
    setDraftMonth("");
    setDraftYear("");
    onChange?.(undefined);
    setMobileOpen(false);
    setDesktopOpen(false);
  }, [onChange]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const label = value ? formatBillMonthLabel(value) : placeholder;

  const triggerContent = (
    <>
      <span className={cn(!value && "text-muted-foreground/50")}>{label}</span>
      <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
    </>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Desktop */}
      <div className="hidden lg:block">
        <Popover
          open={desktopOpen}
          onOpenChange={(open) => {
            setDesktopOpen(open);
            if (open) syncDraftFromValue();
          }}
        >
          <PopoverTrigger className={triggerClass}>{triggerContent}</PopoverTrigger>
          <PopoverContent className="w-[min(100vw-2rem,22rem)] p-4" align="start">
            <MonthYearPanel
              draftMonth={draftMonth}
              draftYear={draftYear}
              onMonthChange={setDraftMonth}
              onYearChange={setDraftYear}
              onConfirm={confirmSelection}
              onClear={clearSelection}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile / tablet */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => {
            syncDraftFromValue();
            setMobileOpen(true);
          }}
          className={triggerClass}
        >
          {triggerContent}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[200] flex items-end lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          <div className="relative z-[201] flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-t border-border bg-card p-5 shadow-lg pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Bill month</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto">
              <MonthYearPanel
                draftMonth={draftMonth}
                draftYear={draftYear}
                onMonthChange={setDraftMonth}
                onYearChange={setDraftYear}
                onConfirm={confirmSelection}
                onClear={clearSelection}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
