"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        className: "bg-black text-white border border-slate-800 rounded-xl shadow-2xl",
        descriptionClassName: "text-slate-400",
        style: {
          fontFamily: "var(--font-geist-sans), sans-serif",
        },
      }}
    />
  );
}
