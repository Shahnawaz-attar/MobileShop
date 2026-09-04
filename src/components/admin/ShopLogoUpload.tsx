"use client";

import { useState, useRef } from "react";
import { uploadShopLogoAction, deleteShopLogoAction } from "@/server/modules/shop/actions";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, Loader2 } from "lucide-react";

type LogoType = "header" | "footer" | "dashboard";

interface ShopLogoUploadProps {
  logoType: LogoType;
  label: string;
  description: string;
  currentUrl: string | null;
}

export function ShopLogoUpload({ logoType, label, description, currentUrl }: ShopLogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setIsUploading(true);

    // Show instant preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append("logoType", logoType);
      formData.append("file", file);

      const result = await uploadShopLogoAction(formData);

      if (result.success) {
        setPreviewUrl(result.data.url);
        toast.success(`${label} updated successfully`);
      } else {
        // Revert preview on failure
        setPreviewUrl(currentUrl);
        toast.error(result.error || "Upload failed");
      }
    } catch {
      setPreviewUrl(currentUrl);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!previewUrl) return;

    setIsDeleting(true);
    try {
      const result = await deleteShopLogoAction(logoType);

      if (result.success) {
        setPreviewUrl(null);
        toast.success(`${label} removed`);
      } else {
        toast.error(result.error || "Failed to remove logo");
      }
    } catch {
      toast.error("Failed to remove logo. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-background/30 p-6 text-center">
      {/* Preview */}
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-muted/30">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="h-full w-full rounded-2xl object-cover"
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Label */}
      <div>
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <label
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
        >
          <Upload className="h-3.5 w-3.5" />
          {previewUrl ? "Replace" : "Upload"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading || isDeleting}
          />
        </label>

        {previewUrl && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isUploading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3.5 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
