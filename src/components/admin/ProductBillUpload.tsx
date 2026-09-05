"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageIcon, Trash2, Upload } from "lucide-react";
import {
  signBillUploadAction,
  saveProductBillAction,
  deleteProductBillAction,
} from "@/server/modules/media/actions";
import { isPdfBillUrl, resolveBillViewUrl } from "@/lib/image";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/button";

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;

type BillMime = "application/pdf" | "image/png" | "image/jpeg" | "image/webp";

function isBillMime(type: string): type is BillMime {
  return (
    type === "application/pdf" ||
    type === "image/png" ||
    type === "image/jpeg" ||
    type === "image/webp"
  );
}

function billLabel(url: string): string {
  return isPdfBillUrl(url) ? "PDF bill uploaded" : "Bill image uploaded";
}

function previewBillUrl(publicId: string | null, storedUrl: string): string {
  if (publicId && isPdfBillUrl(storedUrl)) {
    return resolveBillViewUrl(publicId, storedUrl);
  }
  return storedUrl;
}

interface ProductBillUploadProps {
  productId: string;
  initialBillUrl: string | null;
  initialBillPublicId?: string | null;
}

export function ProductBillUpload({
  productId,
  initialBillUrl,
  initialBillPublicId = null,
}: ProductBillUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [billUrl, setBillUrl] = useState(initialBillUrl);
  const [billPublicId, setBillPublicId] = useState(initialBillPublicId);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isBillMime(file.type)) {
      setError("Use a PDF or PNG/JPEG/WebP image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("Bill file must be 10 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const signRes = await signBillUploadAction({ productId, mimeType: file.type });
      if (!signRes.success) throw new Error(signRes.error);

      const { signature, timestamp, apiKey, folder, cloudName, resourceType } = signRes.data;
      if (!cloudName) throw new Error("Cloud name missing");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        { method: "POST", body: formData }
      );

      const uploadData = (await uploadRes.json()) as {
        public_id?: string;
        secure_url?: string;
        error?: { message?: string };
      };

      if (!uploadRes.ok) {
        throw new Error(uploadData.error?.message ?? "Failed to upload bill");
      }

      if (!uploadData.public_id || !uploadData.secure_url) {
        throw new Error("Cloudinary did not return a bill URL");
      }

      const saveRes = await saveProductBillAction({
        productId,
        publicId: uploadData.public_id,
        url: uploadData.secure_url,
      });

      if (!saveRes.success) throw new Error(saveRes.error);

      setBillUrl(uploadData.secure_url);
      setBillPublicId(uploadData.public_id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteProductBillAction(productId);
      if (res.success) {
        setBillUrl(null);
        setBillPublicId(null);
        setConfirmDelete(false);
        router.refresh();
      } else {
        setError(res.error);
        setConfirmDelete(false);
      }
    });
  };

  const isPdf = billUrl ? isPdfBillUrl(billUrl) : false;
  const isLegacyRaw = billUrl?.includes("/raw/upload/") ?? false;
  const viewUrl = billUrl && !isLegacyRaw ? previewBillUrl(billPublicId, billUrl) : null;

  return (
    <div className="space-y-3">
      {billUrl ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
          {isPdf ? (
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ImageIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {billLabel(billUrl)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!viewUrl}
            onClick={() => viewUrl && window.open(viewUrl, "_blank", "noopener,noreferrer")}
          >
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Optional — upload PDF or PNG. Shown on the website only when a visitor taps &quot;View bill&quot;.
        </p>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading || isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" aria-hidden />
          {uploading ? "Uploading…" : billUrl ? "Replace bill" : "Upload bill (PDF or PNG)"}
        </Button>
      </div>

      {isLegacyRaw ? (
        <p role="alert" className="text-sm text-amber-600">
          This bill used an old upload format and cannot be previewed. Remove it and upload again.
        </p>
      ) : null}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        title="Remove bill?"
        description="This deletes the uploaded bill from Cloudinary. The trust badge can still show if bill is marked available."
        confirmText="Remove"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        isLoading={isPending}
      />
    </div>
  );
}
