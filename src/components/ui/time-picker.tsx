"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
  value: string; // "10:00 AM" format
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const PERIODS: ("AM" | "PM")[] = ["AM", "PM"];

function parseTime(value: string): { hour: string; minute: string; period: "AM" | "PM" } {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: "10", minute: "00", period: "AM" };
  return {
    hour: (match[1] || "10").padStart(2, "0"),
    minute: match[2] || "00",
    period: (match[3] || "AM").toUpperCase() as "AM" | "PM",
  };
}

export function TimePicker({ value, onChange, id, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { hour, minute, period } = parseTime(value);

  // Prevent background scroll when modal is open (matching ConfirmModal pattern)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleChange(h: string, m: string, p: string) {
    onChange(`${h}:${m} ${p}`);
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex h-9 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl border border-border/60 bg-background/90 px-3 py-1 text-xs font-bold text-foreground shadow-sm transition-all",
          "hover:border-primary/50 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-primary ring-2 ring-primary/20 bg-background text-primary"
        )}
      >
        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="tabular-nums whitespace-nowrap">{hour}:{minute} {period}</span>
      </button>

      {/* Modal / Bottom Sheet - Exact ConfirmModal Architecture */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div 
            className="relative z-50 flex max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-full sm:rounded-2xl sm:slide-in-from-bottom-10 sm:zoom-in-95"
            role="dialog"
            aria-modal="true"
          >
            {/* Header (fixed) */}
            <div className="shrink-0 border-b border-border/40 p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Select Time
                  </span>
                  <p className="text-2xl font-bold text-primary tabular-nums mt-0.5">
                    {hour}:{minute} {period}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable selector area */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 pt-4">
              {/* Selector Columns */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/20 p-2 border border-border/40">
                {/* Hours */}
                <div className="flex flex-col">
                  <span className="py-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Hour
                  </span>
                  <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 scrollbar-none">
                    {HOURS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleChange(h, minute, period)}
                        className={cn(
                          "flex w-full items-center justify-center rounded-lg py-2 text-xs font-bold transition-all",
                          h === hour
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-background/80"
                        )}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutes */}
                <div className="flex flex-col border-x border-border/30 px-1">
                  <span className="py-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Min
                  </span>
                  <div className="max-h-[160px] overflow-y-auto space-y-1 scrollbar-none">
                    {MINUTES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleChange(hour, m, period)}
                        className={cn(
                          "flex w-full items-center justify-center rounded-lg py-2 text-xs font-bold transition-all",
                          m === minute
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-background/80"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period */}
                <div className="flex flex-col">
                  <span className="py-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Period
                  </span>
                  <div className="space-y-1.5 pt-1">
                    {PERIODS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleChange(hour, minute, p)}
                        className={cn(
                          "flex w-full items-center justify-center rounded-lg py-2.5 text-xs font-bold transition-all",
                          p === period
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-background/80"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Action (fixed at bottom) */}
            <div className="shrink-0 border-t border-border/40 p-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-11 w-full text-sm font-bold shadow-sm"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
