"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  signUploadAction,
  attachMediaAction,
  deleteMediaAction,
} from "@/server/modules/media/actions";
import type { MediaKind } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface MediaItem {
  id: string;
  url: string;
  kind: MediaKind;
  sortOrder: number;
}

interface ProductMediaUploadProps {
  productId: string;
  initialMedia: MediaItem[];
}

export function ProductMediaUpload({ productId, initialMedia }: ProductMediaUploadProps) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Downscale + compress a raw camera file in-browser BEFORE upload.
   * Keeps counter-4G uploads fast and protects Cloudinary credits.
   * Returns the original file if it's already small / not an image.
   */
  async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) return file;
    // Skip WebP/AVIF etc. that are already small enough
    if (file.type === "image/webp" && file.size < 300 * 1024) return file;
    if (file.size < 600 * 1024) return file; // under ~600KB, no need

    try {
      return await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.8,
      });
    } catch {
      // If compression fails, fall back to the original file.
      return file;
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (media.length + files.length > 8) {
      setError("Maximum 8 photos allowed.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const newMediaItems = [...media];

      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i];
        if (!rawFile) continue;

        // 1. Compress / downscale before anything hits the network
        const file = await compressImage(rawFile);

        // 2. Get signature from server
        const signRes = await signUploadAction({ productId, kind: "OTHER" });
        if (!signRes.success) throw new Error(signRes.error);
        
        const { signature, timestamp, apiKey, folder, cloudName } = signRes.data;
        if (!cloudName) throw new Error("Cloud name missing");

        // 2. Upload directly to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!uploadRes.ok) throw new Error("Failed to upload to Cloudinary");
        const uploadData = await uploadRes.json();

        // 3. Attach to product in our DB
        const attachRes = await attachMediaAction({
          productId,
          publicId: uploadData.public_id,
          url: uploadData.secure_url,
          width: uploadData.width,
          height: uploadData.height,
          kind: "OTHER",
        });

        if (!attachRes.success) throw new Error(attachRes.error);

        newMediaItems.push({
          id: attachRes.data.id,
          url: uploadData.secure_url,
          kind: "OTHER",
          sortOrder: newMediaItems.length,
        });
      }

      setMedia(newMediaItems);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmDelete = () => {
    if (!mediaToDelete) return;

    startTransition(async () => {
      const res = await deleteMediaAction(mediaToDelete);
      if (res.success) {
        setMedia((prev) => prev.filter((m) => m.id !== mediaToDelete));
        setMediaToDelete(null);
        router.refresh();
      } else {
        setError(res.error);
        setMediaToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid of existing media */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {media.map((m, index) => (
            <div
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {index === 0 && (
                <div className="absolute left-2 top-2 z-10 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow">
                  Primary
                </div>
              )}
              <img
                src={m.url}
                alt="Product"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setMediaToDelete(m.id)}
                disabled={isPending}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 disabled:opacity-50"
                aria-label="Delete photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {media.length < 8 && (
        <div className="flex justify-center rounded-xl border border-dashed border-border p-6 text-center">
          <div>
            <label
              htmlFor="photo-upload"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Select Photos"}
            </label>
            <input
              id="photo-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || isPending}
              onChange={handleFileChange}
              className="sr-only"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Up to {8 - media.length} more photos. Max 10MB each.
            </p>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!mediaToDelete}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? It will be permanently removed from your device listing."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setMediaToDelete(null)}
      />
    </div>
  );
}
