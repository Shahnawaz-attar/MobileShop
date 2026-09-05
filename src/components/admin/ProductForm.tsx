"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProductAction,
  updateProductAction,
} from "@/server/modules/catalog/actions";
import { rupeesToPaise } from "@/lib/money";
import {
  CONDITION_LABELS,
  CONDITION_DESCRIPTIONS,
} from "@/lib/constants";
import { ProductMediaUpload } from "@/components/admin/ProductMediaUpload";
import { BrandModelPicker } from "@/components/admin/BrandModelPicker";
import { ProductPublishSuccess } from "@/components/admin/ProductPublishSuccess";
import type {
  BrandOption,
  ModelOption,
  AdminProductDetail,
  Condition,
  BatteryType,
  BatteryRating,
  Availability,
  DeviceType,
} from "@/types";
import { Button } from "@/components/ui/button";

interface ProductFormProps {
  brands: BrandOption[];
  models: ModelOption[];
  product?: AdminProductDetail | null;
  shopName: string;
  publicAppUrl: string;
}

const STORAGE_OPTIONS = [32, 64, 128, 256, 512, 1024] as const;
const RAM_OPTIONS = [2, 3, 4, 6, 8, 12, 16] as const;
const CONDITION_OPTIONS: Condition[] = ["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR"];
const BATTERY_RATING_OPTIONS: BatteryRating[] = ["GOOD", "AVERAGE", "NEEDS_REPLACEMENT"];
const AVAILABILITY_OPTIONS: Availability[] = ["DRAFT", "AVAILABLE", "RESERVED", "SOLD"];

/** Price sanity threshold — warn if price is an outlier (very high) */
const PRICE_WARN_PAISE = 200_000_00; // ₹2,00,000

const inputClass =
  "block w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background disabled:cursor-not-allowed disabled:opacity-50";
const labelClass = "block text-sm font-semibold text-foreground mb-1.5";
const sectionClass = "rounded-2xl border border-border/50 bg-card p-5 sm:p-7 shadow-sm transition-shadow hover:shadow-md";

export function ProductForm({ brands, models, product, shopName, publicAppUrl }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<{
    slug: string;
    title: string;
    pricePaise: number;
    storageGb: number | null;
    colour: string | null;
    condition: Condition;
  } | null>(null);

  // Form state
  const [brandList, setBrandList] = useState(brands);
  const [modelList, setModelList] = useState(models);
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [modelId, setModelId] = useState(product?.modelId ?? "");
  const [title, setTitle] = useState(product?.title ?? "");
  const [deviceType, setDeviceType] = useState<DeviceType>(product?.deviceType ?? "PHONE");
  const [storageGb, setStorageGb] = useState<number | null>(product?.storageGb ?? 128);
  const [ramGb, setRamGb] = useState<number | null>(product?.ramGb ?? null);
  const [colour, setColour] = useState(product?.colour ?? "");
  const [priceRupees, setPriceRupees] = useState(
    product ? String(Math.round(product.pricePaise / 100)) : ""
  );
  const [mrpRupees, setMrpRupees] = useState(
    product?.mrpPaise ? String(Math.round(product.mrpPaise / 100)) : ""
  );
  const [condition, setCondition] = useState<Condition>(product?.condition ?? "EXCELLENT");
  const [conditionNotes, setConditionNotes] = useState(product?.conditionNotes ?? "");
  const [batteryType, setBatteryType] = useState<BatteryType>(product?.batteryType ?? "UNKNOWN");
  const [batteryPct, setBatteryPct] = useState(
    product?.batteryPct != null ? String(product.batteryPct) : ""
  );
  const [batteryRating, setBatteryRating] = useState<BatteryRating | null>(
    product?.batteryRating ?? null
  );
  const [warrantyMonths, setWarrantyMonths] = useState(
    product?.warrantyMonths != null ? String(product.warrantyMonths) : ""
  );
  const [hasBox, setHasBox] = useState(product?.hasBox ?? false);
  const [hasCharger, setHasCharger] = useState(product?.hasCharger ?? false);
  const [hasCable, setHasCable] = useState(product?.hasCable ?? false);
  const [hasBill, setHasBill] = useState(product?.hasBill ?? false);
  const [purchasedAt, setPurchasedAt] = useState(
    product?.purchasedAt ? product.purchasedAt.toISOString().slice(0, 10) : ""
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [internalNotes, setInternalNotes] = useState(product?.internalNotes ?? "");
  const [availability, setAvailability] = useState<Availability>(
    product?.availability ?? "DRAFT"
  );

  const pricePaise = priceRupees ? rupeesToPaise(Number(priceRupees)) : 0;
  const mrpPaise = mrpRupees ? rupeesToPaise(Number(mrpRupees)) : null;
  const showPriceWarning = pricePaise > PRICE_WARN_PAISE;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    if (!brandId) {
      setError("Please select a brand");
      return;
    }
    if (!pricePaise || pricePaise <= 0) {
      setError("Please enter a valid price");
      return;
    }

    const input = {
      brandId,
      modelId: modelId || null,
      title: title.trim(),
      deviceType,
      storageGb,
      ramGb,
      colour: colour.trim() || null,
      pricePaise,
      mrpPaise,
      condition,
      conditionNotes: conditionNotes.trim() || null,
      batteryType,
      batteryPct: batteryPct ? Number(batteryPct) : null,
      batteryRating,
      warrantyMonths: warrantyMonths ? Number(warrantyMonths) : null,
      hasBox,
      hasCharger,
      hasCable,
      hasBill: deviceType === "PHONE" || deviceType === "TABLET" ? hasBill : false,
      purchasedAt:
        (deviceType === "PHONE" || deviceType === "TABLET") && purchasedAt
          ? new Date(`${purchasedAt}T12:00:00`)
          : null,
      description: description.trim() || null,
      availability,
      internalNotes: internalNotes.trim() || null,
    };

    startTransition(async () => {
      setError(null);
      const result = product
        ? await updateProductAction(product.id, input)
        : await createProductAction(input);

      if (result.success) {
        if (!product) {
          router.push(`/admin/products/${result.data.id}/edit`);
          router.refresh();
        } else if (availability === "AVAILABLE") {
          setPublishSuccess({
            slug: result.data.slug,
            title: result.data.title,
            pricePaise,
            storageGb,
            colour: colour.trim() || null,
            condition,
          });
        } else {
          router.push("/admin/products");
          router.refresh();
        }
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {publishSuccess && (
        <ProductPublishSuccess
          {...publishSuccess}
          shopName={shopName}
          publicAppUrl={publicAppUrl}
          onDismiss={() => setPublishSuccess(null)}
        />
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Photos (Only available after initial save) */}
      <section className={sectionClass}>
        <h2 className="text-base font-semibold text-foreground">Photos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Clear, bright photos help devices sell faster.
        </p>

        <div className="mt-4">
          {product ? (
            <ProductMediaUpload
              productId={product.id}
              initialMedia={product.media || []}
            />
          ) : (
            <div className="flex justify-center rounded-xl border border-dashed border-border bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Save the device details below first, then you can add photos.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Essentials */}
      <section className={sectionClass}>
        <h2 className="text-base font-semibold text-foreground">Essentials</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The minimum needed to list a device.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <BrandModelPicker
            deviceType={deviceType}
            brandId={brandId}
            modelId={modelId}
            brands={brandList}
            models={modelList}
            onDeviceTypeChange={setDeviceType}
            onBrandIdChange={setBrandId}
            onModelIdChange={setModelId}
            onBrandCreated={(brand) => {
              setBrandList((prev) =>
                prev.some((b) => b.id === brand.id) ? prev : [...prev, brand]
              );
            }}
            onModelCreated={(model) => {
              setModelList((prev) =>
                prev.some((m) => m.id === model.id) ? prev : [...prev, model]
              );
            }}
            onSuggestTitle={(name) => {
              setTitle((current) => (current.trim() ? current : name));
            }}
          />

          {/* Title */}
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="title" className={labelClass}>
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. iPhone 15"
              className={inputClass}
            />
            {product && (
              <p className="mt-1 text-xs text-muted-foreground">
                Public Link: <a href={`/phones/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono">/phones/{product.slug}</a>
              </p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label htmlFor="price" className={labelClass}>
              Selling Price (₹) <span className="text-destructive">*</span>
            </label>
            <input
              id="price"
              type="text"
              inputMode="numeric"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value.replace(/[^0-9]/g, ""))}
              required
              placeholder="e.g. 32999"
              className={inputClass}
            />
            {showPriceWarning && (
              <p className="text-sm text-warning" role="alert">
                ₹{priceRupees} — is this price correct?
              </p>
            )}
          </div>

          {/* MRP */}
          <div className="space-y-2">
            <label htmlFor="mrp" className={labelClass}>
              MRP (₹) <span className="text-muted-foreground font-normal">— optional</span>
            </label>
            <input
              id="mrp"
              type="text"
              inputMode="numeric"
              value={mrpRupees}
              onChange={(e) => setMrpRupees(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 59999"
              className={inputClass}
            />
          </div>

          {/* Storage — only for phones & tablets */}
          {deviceType !== "OTHER" && (
            <div className="space-y-2">
              <label htmlFor="storage" className={labelClass}>
                Storage
              </label>
              <select
                id="storage"
                value={storageGb ?? ""}
                onChange={(e) => setStorageGb(e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              >
                {STORAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s >= 1024 ? `${s / 1024}TB` : `${s}GB`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* RAM — only for phones & tablets */}
          {deviceType !== "OTHER" && (
            <div className="space-y-2">
              <label htmlFor="ram" className={labelClass}>
                RAM
              </label>
              <select
                id="ram"
                value={ramGb ?? ""}
                onChange={(e) => setRamGb(e.target.value ? Number(e.target.value) : null)}
                className={inputClass}
              >
                <option value="">Select RAM</option>
                {RAM_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}GB
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Colour */}
          <div className="space-y-2">
            <label htmlFor="colour" className={labelClass}>
              Colour
            </label>
            <input
              id="colour"
              type="text"
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              placeholder="e.g. Blue"
              className={inputClass}
            />
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <label htmlFor="condition" className={labelClass}>
              Condition <span className="text-destructive">*</span>
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              required
              className={inputClass}
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {CONDITION_DESCRIPTIONS[condition]}
            </p>
          </div>
        </div>
      </section>

      {/* Battery — only for phones & tablets (devices with a battery) */}
      {deviceType !== "OTHER" && (
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-foreground">Battery</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="batteryType" className={labelClass}>
                Battery info
              </label>
              <select
                id="batteryType"
                value={batteryType}
                onChange={(e) => setBatteryType(e.target.value as BatteryType)}
                className={inputClass}
              >
                <option value="UNKNOWN">Not measured</option>
                <option value="PERCENTAGE">Battery health (%)</option>
                <option value="RATED">Battery rating</option>
              </select>
            </div>

            {batteryType === "PERCENTAGE" && (
              <div className="space-y-2">
                <label htmlFor="batteryPct" className={labelClass}>
                  Battery health (%)
                </label>
                <input
                  id="batteryPct"
                  type="text"
                  inputMode="numeric"
                  value={batteryPct}
                  onChange={(e) => setBatteryPct(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 92"
                  className={inputClass}
                />
              </div>
            )}

            {batteryType === "RATED" && (
              <div className="space-y-2">
                <label htmlFor="batteryRating" className={labelClass}>
                  Battery rating
                </label>
                <select
                  id="batteryRating"
                  value={batteryRating ?? ""}
                  onChange={(e) =>
                    setBatteryRating(e.target.value ? (e.target.value as BatteryRating) : null)
                  }
                  className={inputClass}
                >
                  <option value="">Select rating</option>
                  {BATTERY_RATING_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r === "GOOD" ? "Good" : r === "AVERAGE" ? "Average" : "Needs replacement"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Warranty & accessories */}
      <section className={sectionClass}>
        <h2 className="text-base font-semibold text-foreground">Warranty &amp; Box</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="warranty" className={labelClass}>
              Warranty (months)
            </label>
            <input
              id="warranty"
              type="text"
              inputMode="numeric"
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 3"
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={hasBox}
                onChange={(e) => setHasBox(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-accent"
              />
              Box
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={hasCharger}
                onChange={(e) => setHasCharger(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-accent"
              />
              Charger
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={hasCable}
                onChange={(e) => setHasCable(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-accent"
              />
              Cable
            </label>
          </div>
        </div>
      </section>

      {(deviceType === "PHONE" || deviceType === "TABLET") && (
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-foreground">Bill &amp; device age</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Buyers see this on the product page only when bill is confirmed — builds trust for second-hand devices.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="purchasedAt" className={labelClass}>
                Original bill date
              </label>
              <input
                id="purchasedAt"
                type="date"
                value={purchasedAt}
                onChange={(e) => setPurchasedAt(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={hasBill}
                  onChange={(e) => setHasBill(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-accent"
                />
                Original bill available (show on website)
              </label>
            </div>
          </div>
        </section>
      )}

      {/* Details */}
      <section className={sectionClass}>
        <h2 className="text-base font-semibold text-foreground">Details</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="conditionNotes" className={labelClass}>
              Condition notes
            </label>
            <textarea
              id="conditionNotes"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Minor scratch on the back"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Well maintained phone, battery health 92%"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="internalNotes" className={labelClass}>
              Internal notes{" "}
              <span className="font-normal text-muted-foreground">— never shown to buyers</span>
            </label>
            <textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Purchased from supplier X on date"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Availability */}
      <section className={sectionClass}>
        <h2 className="text-base font-semibold text-foreground">Status</h2>
        <div className="mt-4 space-y-2">
          <label htmlFor="availability" className={labelClass}>
            Availability
          </label>
          <select
            id="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as Availability)}
            className={inputClass}
          >
            {AVAILABILITY_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a === "DRAFT"
                  ? "Draft (not visible)"
                  : a === "AVAILABLE"
                    ? "Available (published)"
                    : a === "RESERVED"
                      ? "Reserved"
                      : "Sold"}
              </option>
            ))}
          </select>
          {availability === "AVAILABLE" && (
            <p className="text-xs text-muted-foreground">
              Selecting &ldquo;Available&rdquo; publishes this device to your website.
            </p>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="sticky bottom-4 z-10 mt-8 flex items-center justify-end gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-lg backdrop-blur-xl sm:static sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none sm:border-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="h-12 flex-1 sm:flex-none px-6 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 flex-1 sm:flex-none px-8 rounded-xl shadow-md"
        >
          {isPending
            ? "Saving…"
            : availability === "AVAILABLE" && !product
              ? "Publish device"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
