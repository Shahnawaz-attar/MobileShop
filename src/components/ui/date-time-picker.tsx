"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

interface DateTimePickerProps {
  /** The current datetime value (or undefined). */
  value?: Date;
  onChange: (date: Date) => void;
  /** Label shown above the two controls. */
  label?: string;
}

function to12h(date: Date): string {
  let h = date.getHours();
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${String(h).padStart(2, "0")}:${m} ${period}`;
}

/** Convert a "HH:MM AM/PM" string + a date's y/m/d into a Date. */
function applyTime(date: Date, time: string): Date {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return date;
  let h = Number(match[1]) % 12;
  if ((match[3] || "").toUpperCase() === "PM") h += 12;
  const d = new Date(date);
  d.setHours(h, Number(match[2]), 0, 0);
  return d;
}

/**
 * Mobile-first date + time picker (proper bottom-sheet popups on phones,
 * calendar/time popovers on desktop) — replaces the native HTML datetime-local.
 */
export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const base = value ?? new Date();

  const handleDateChange = (d?: Date) => {
    if (!d) return;
    // Keep the previously chosen time when the date changes.
    const next = new Date(d);
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(next);
  };

  const handleTimeChange = (time: string) => {
    onChange(applyTime(base, time));
  };

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-semibold">{label}</span>}
      <div className="flex items-center gap-2">
        <DatePicker value={base} onChange={handleDateChange} className="flex-1 min-w-0" />
        <TimePicker value={to12h(base)} onChange={handleTimeChange} />
      </div>
    </div>
  );
}
