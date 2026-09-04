"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Prevent body scroll when open
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in-0"
        onClick={() => !isLoading && onCancel()}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div 
        className="relative z-50 w-full max-w-lg rounded-t-2xl border border-border bg-card p-6 shadow-lg animate-in slide-in-from-bottom-full sm:rounded-2xl sm:slide-in-from-bottom-10 sm:zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="h-11 w-full sm:w-auto px-4"
            >
              {cancelText}
            </Button>
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={isLoading}
              className="h-11 w-full sm:w-auto px-4 shadow-sm"
            >
              {isLoading ? "Please wait..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
