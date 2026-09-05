"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { setAvailabilityAction, deleteProductAction, loadMoreAdminProductsAction } from "@/server/modules/catalog/actions";
import type { Availability } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button, buttonVariants } from "@/components/ui/button";

interface ProductListItem {
  id: string;
  slug: string;
  title: string;
  deviceType: "PHONE" | "TABLET" | "OTHER";
  deviceTypeLabel: string;
  storageGb: number | null;
  colour: string | null;
  price: string;
  conditionLabel: string;
  availabilityLabel: string;
  availability: Availability;
  isFeatured: boolean;
  primaryImageUrl: string | null;
  imageCount: number;
  brandName: string;
}

interface ProductListClientProps {
  initialProducts: ProductListItem[];
  initialNextCursor?: string | null;
  tab?: string;
  q?: string;
}

/** Availability status chip colour mapping */
const STATUS_STYLES: Record<Availability, string> = {
  AVAILABLE: "bg-success/10 text-success",
  RESERVED: "bg-warning/10 text-warning",
  SOLD: "bg-muted text-muted-foreground",
  DRAFT: "bg-info/10 text-info",
};

interface Toast {
  id: number;
  message: string;
}

export function ProductListClient({ initialProducts, initialNextCursor, tab, q }: ProductListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Sync state when tab or query changes
  const prevTabRef = useRef(tab);
  const prevQRef = useRef(q);

  if (prevTabRef.current !== tab || prevQRef.current !== q) {
    prevTabRef.current = tab;
    prevQRef.current = q;
    setProducts(initialProducts);
    setNextCursor(initialNextCursor);
  }

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const availability = tab === "ALL" ? undefined : (tab as Availability);
      const res = await loadMoreAdminProductsAction(availability, q, nextCursor);
      setProducts((prev) => [...prev, ...res.products]);
      setNextCursor(res.nextCursor);
    } catch {
      showToast("Failed to load more products");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  /** Quick dopamine burst when a phone is marked SOLD (keeps stock accurate). */
  const celebrateSold = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {
        /* ignore */
      }
    }
    confetti({
      particleCount: 90,
      spread: 75,
      startVelocity: 42,
      origin: { y: 0.6 },
      colors: ["#25D366", "#16a34a", "#0a0a0a", "#ffffff"],
      disableForReducedMotion: true,
    });
  };

  const handleSetAvailability = (id: string, availability: Availability) => {
    startTransition(async () => {
      const result = await setAvailabilityAction(id, availability);
      if (result.success) {
        
        // Optimistic UI update
        setProducts((prev) => 
          prev.map((p) => 
            p.id === id ? { 
              ...p, 
              availability, 
              availabilityLabel: availability === "SOLD" ? "Sold" : availability === "AVAILABLE" ? "Available" : p.availabilityLabel 
            } : p
          )
        );

        if (availability === "SOLD") {
          celebrateSold();
        }

        showToast(
          availability === "SOLD" ? "Marked as sold" : `Marked as ${availability.toLowerCase()}`
        );
        router.refresh();
      } else {
        showToast(result.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!productToDelete) return;

    startTransition(async () => {
      const result = await deleteProductAction(productToDelete);
      if (result.success) {
        showToast("Draft deleted");
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
        setProductToDelete(null);
        router.refresh();
      } else {
        showToast(result.error);
        setProductToDelete(null);
      }
    });
  };

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <p className="text-3xl" aria-hidden="true">📱</p>
        <h2 className="mt-3 text-lg font-semibold text-foreground">
          No devices here yet
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first device to get started.
        </p>
        <Link
          href="/admin/products/new"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add a device
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 hover:border-border/80 hover:shadow-md sm:p-5"
          >
            {/* Top row: thumbnail + info + status */}
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <Link
                href={`/admin/products/${product.id}/edit`}
                className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50 transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
              >
                {product.primaryImageUrl ? (
                  <img
                    src={product.primaryImageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl" aria-hidden="true">
                    {product.deviceType === "TABLET" ? "📲" : product.deviceType === "OTHER" ? "⌚" : "📱"}
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="block truncate text-base font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {product.title}
                  </Link>
                  {/* Status chip (top-right) */}
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[product.availability]}`}
                  >
                    {product.availabilityLabel}
                  </span>
                </div>
                
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {product.deviceTypeLabel}
                  {product.brandName ? ` · ${product.brandName}` : ""}
                  {product.storageGb ? ` · ${product.storageGb}GB` : ""}
                  {product.colour ? ` · ${product.colour}` : ""}
                </p>
                
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{product.price}</span>
                    {product.isFeatured && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row: condition + actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground">
                  {product.conditionLabel}
                </span>
                {product.imageCount === 0 && (
                  <span className="rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                    No photos
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {product.availability !== "DRAFT" && (
                  <a
                    href={`/phones/${product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    title="Preview public page"
                  >
                    Preview
                  </a>
                )}
                {product.availability !== "SOLD" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleSetAvailability(product.id, "SOLD")}
                    className="bg-success/10 text-success hover:bg-success/20"
                  >
                    Mark Sold
                  </Button>
                )}
                {product.availability === "SOLD" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleSetAvailability(product.id, "AVAILABLE")}
                  >
                    Available
                  </Button>
                )}
              {product.availability === "DRAFT" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setProductToDelete(product.id)}
                  disabled={isPending}
                  className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  Delete
                </Button>
              )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {nextCursor && (
        <div className="mt-6 flex justify-center pb-8 sm:pb-0">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full sm:w-auto h-12 sm:h-11 px-8 text-base sm:text-sm font-semibold rounded-xl"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-lg"
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!productToDelete}
        title="Delete Draft"
        description="Are you sure you want to delete this draft device? All associated photos will also be permanently deleted from Cloudinary."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
