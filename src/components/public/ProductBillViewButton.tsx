"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductBillViewButtonProps {
  billUrl: string;
}

export function ProductBillViewButton({ billUrl }: ProductBillViewButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full rounded-xl border-emerald-300 bg-white text-sm font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 sm:w-auto sm:px-5"
      onClick={() => window.open(billUrl, "_blank", "noopener,noreferrer")}
    >
      <ExternalLink className="h-4 w-4" aria-hidden />
      View original bill
    </Button>
  );
}
