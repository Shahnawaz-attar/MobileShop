"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Close the mobile modal on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when mobile modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const buttonClass = cn(
    "w-full rounded-xl border border-input/50 bg-background/50 px-4 py-3 text-sm font-medium text-left shadow-sm transition-all hover:border-input focus:border-primary focus:outline-none flex items-center justify-between",
    !value && "text-muted-foreground/50",
    className
  );

  const buttonContent = (
    <>
      {value ? format(value, "PPP") : <span>{placeholder}</span>}
      <CalendarIcon className="h-4 w-4 opacity-50" />
    </>
  );

  return (
    <>
      {/* Desktop Popover (hidden on mobile) */}
      <div className="hidden sm:block">
        <Popover>
          <PopoverTrigger className={buttonClass}>
            {buttonContent}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={onChange}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Button Trigger (hidden on desktop) */}
      <div className="block sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={buttonClass}
        >
          {buttonContent}
        </button>
      </div>

      {/* Mobile Modal Drawer (hidden on desktop) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in-0" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Modal Content */}
          <div className="relative z-[101] w-full rounded-t-2xl border-t border-border bg-card p-6 shadow-lg pb-10 animate-in slide-in-from-bottom-full flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 px-2">
              <h2 className="text-lg font-semibold text-foreground">Select Date</h2>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <Calendar
              mode="single"
              selected={value}
              onSelect={(d) => {
                onChange?.(d);
                setIsOpen(false);
              }}
              className="rounded-xl border border-border/50 bg-card"
            />
          </div>
        </div>
      )}
    </>
  );
}
