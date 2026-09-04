"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";

export interface MultiSelectProps {
  options: { id: string; label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Select items...", className }: MultiSelectProps) {
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

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = selected
    .map((val) => options.find((opt) => opt.value === val)?.label)
    .filter(Boolean);
    
  const displayText = selectedLabels.length > 0 
    ? selectedLabels.join(", ") 
    : placeholder;

  const buttonClass = cn(
    "w-full flex items-center justify-between rounded-xl border border-input/50 bg-background/50 px-4 py-3 text-sm font-medium text-left shadow-sm transition-all hover:border-input focus:border-primary focus:outline-none",
    selected.length === 0 && "text-muted-foreground/50",
    className
  );

  const buttonContent = (
    <>
      <span className="truncate pr-4">{displayText}</span>
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 opacity-50 shrink-0"
      >
        <path
          d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    </>
  );

  const OptionsList = () => (
    <div className="flex max-h-64 flex-col overflow-y-auto p-1">
      {options.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No options available
        </div>
      ) : (
        options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.value)}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                isSelected ? "text-primary font-medium bg-accent/50" : "text-foreground"
              )}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
              </span>
              {option.label}
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Popover (hidden on mobile) */}
      <div className="hidden sm:block">
        <Popover>
          <PopoverTrigger className={buttonClass}>
            {buttonContent}
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <OptionsList />
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
          <div className="relative z-[101] w-full rounded-t-2xl border-t border-border bg-card p-4 shadow-lg pb-10 animate-in slide-in-from-bottom-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-4 px-2">
              <h2 className="text-lg font-semibold text-foreground">Select Brands</h2>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <OptionsList />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
