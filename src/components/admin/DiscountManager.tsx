"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createDiscountAction,
  updateDiscountAction,
  deleteDiscountAction,
  toggleDiscountAction,
} from "@/server/modules/discounts/actions";
import { BadgePercent, Plus, Pencil, Trash2, X, Save, Power, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { SearchableMultiSelect } from "@/components/shared/SearchableMultiSelect";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface DiscountRow {
  id: string;
  label: string;
  percent: number;
  brandIds: string[];
  productIds: string[];
  brandNames: string[];
  productTitles: string[];
  startsAt: string; // ISO
  endsAt: string; // ISO
  isActive: boolean;
}

interface DiscountManagerProps {
  discounts: DiscountRow[];
  brands: { id: string; name: string; slug: string }[];
  products: { id: string; title: string; brandName: string }[];
}

type TargetKind = "brand" | "product";

interface FormState {
  label: string;
  percent: string;
  kind: TargetKind;
  brandIds: string[];
  productIds: string[];
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

function emptyForm(): FormState {
  const now = new Date();
  const start = new Date(now.getTime());
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    label: "",
    percent: "10",
    kind: "brand",
    brandIds: [],
    productIds: [],
    startsAt: start,
    endsAt: end,
    isActive: true,
  };
}

export function DiscountManager({ discounts, brands, products }: DiscountManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const brandOptions = useMemo(
    () => brands.map((b) => ({ id: b.id, label: b.name })),
    [brands]
  );
  const productOptions = useMemo(
    () => products.map((p) => ({ id: p.id, label: p.title, hint: p.brandName })),
    [products]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setCreating(true);
  };

  const openEdit = (d: DiscountRow) => {
    setEditingId(d.id);
    const isBrand = d.brandIds.length > 0;
    setForm({
      label: d.label,
      percent: String(d.percent),
      kind: isBrand ? "brand" : "product",
      brandIds: d.brandIds,
      productIds: d.productIds,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
      isActive: d.isActive,
    });
    setError(null);
    setCreating(true);
  };

  const submit = () => {
    setError(null);
    const startsAt = form.startsAt;
    const endsAt = form.endsAt;
    if (!form.label.trim()) return setError("Give this offer a label, e.g. Diwali Sale.");
    const percent = Number(form.percent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 90)
      return setError("Discount must be a whole number between 1 and 90.");
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()))
      return setError("Please set both a start and end time.");
    if (endsAt <= startsAt) return setError("End time must be after the start time.");
    if (form.kind === "brand" && form.brandIds.length === 0)
      return setError("Pick at least one brand.");
    if (form.kind === "product" && form.productIds.length === 0)
      return setError("Pick at least one product.");

    const payload = {
      label: form.label.trim(),
      percent,
      brandIds: form.kind === "brand" ? form.brandIds : [],
      productIds: form.kind === "product" ? form.productIds : [],
      startsAt,
      endsAt,
      isActive: form.isActive,
    };

    startTransition(async () => {
      const res = editingId
        ? await updateDiscountAction(editingId, payload)
        : await createDiscountAction(payload);
      if (res.success) {
        setCreating(false);
        setEditingId(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const toggle = (d: DiscountRow) => {
    startTransition(async () => {
      await toggleDiscountAction(d.id, !d.isActive);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteDiscountAction(id);
      setConfirmDelete(null);
      router.refresh();
    });
  };

  const now = Date.now();

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          {discounts.length} {discounts.length === 1 ? "offer" : "offers"}
        </p>
        {!creating && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> New discount
          </button>
        )}
      </div>

      {/* Form */}
      {creating && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <BadgePercent className="h-5 w-5 text-primary" />
              {editingId ? "Edit discount" : "New discount"}
            </h2>
            <button
              onClick={() => {
                setCreating(false);
                setEditingId(null);
              }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="disc-label">
                Offer label / reason
              </label>
              <input
                id="disc-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Diwali Sale, Clearance"
                maxLength={60}
                className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="disc-percent">
                Discount %
              </label>
              <div className="relative">
                <input
                  id="disc-percent"
                  type="number"
                  min={1}
                  max={90}
                  value={form.percent}
                  onChange={(e) => setForm({ ...form, percent: e.target.value })}
                  className="block w-full rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Target type */}
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-semibold">Apply to</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, kind: "brand", productIds: [] })}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
                  form.kind === "brand"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Brands
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, kind: "product", brandIds: [] })}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
                  form.kind === "product"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Specific products
              </button>
            </div>
          </div>

          {form.kind === "brand" ? (
            <div className="mt-4">
              <SearchableMultiSelect
                label="Brands (choose one or more)"
                options={brandOptions}
                selectedIds={form.brandIds}
                onChange={(ids) => setForm({ ...form, brandIds: ids })}
                placeholder="Select brands…"
                searchPlaceholder="Search brands…"
                emptyText="No matching brands"
              />
            </div>
          ) : (
            <div className="mt-4">
              <SearchableMultiSelect
                label="Products (choose one or more)"
                options={productOptions}
                selectedIds={form.productIds}
                onChange={(ids) => setForm({ ...form, productIds: ids })}
                placeholder="Select products…"
                searchPlaceholder="Search by name or brand…"
                emptyText="No matching live products"
              />
            </div>
          )}

          {/* Dates — strict, mobile-first pickers */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateTimePicker
              label="Starts"
              value={form.startsAt}
              onChange={(d) => setForm({ ...form, startsAt: d })}
            />
            <DateTimePicker
              label="Ends"
              value={form.endsAt}
              onChange={(d) => setForm({ ...form, endsAt: d })}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            The offer is only live between these times. Set a start in the past to go live immediately.
          </p>

          <label className="mt-4 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium text-foreground">Active (apply within the date range)</span>
          </label>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "Save changes" : "Create discount"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditingId(null);
              }}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {discounts.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BadgePercent className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-foreground">No discounts yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first offer — e.g. &quot;20% off Apple &amp; Samsung this Diwali&quot; — and it shows on your live catalogue automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map((d) => {
            const starts = new Date(d.startsAt).getTime();
            const ends = new Date(d.endsAt).getTime();
            const live = d.isActive && now >= starts && now <= ends;
            const upcoming = d.isActive && now < starts;
            const ended = d.isActive && now > ends;
            const paused = !d.isActive;
            const isBrand = d.brandIds.length > 0;
            const targetText = isBrand
              ? d.brandNames.join(", ")
              : d.productTitles.join(", ");

            return (
              <div
                key={d.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-error/10 px-2.5 py-1 text-xs font-black text-error">
                        {d.percent}% OFF
                      </span>
                      <span className="text-sm font-bold text-foreground">{d.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          live
                            ? "bg-success/10 text-success"
                            : paused
                              ? "bg-muted text-muted-foreground"
                              : upcoming
                                ? "bg-info/10 text-info"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {live ? "Live" : paused ? "Paused" : upcoming ? "Upcoming" : "Ended"}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium text-foreground">
                      {isBrand ? "Brands: " : "Products: "}
                      {targetText}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(new Date(d.startsAt), "d MMM yyyy, h:mm a")} → {format(new Date(d.endsAt), "d MMM yyyy, h:mm a")}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => toggle(d)}
                      disabled={isPending}
                      title={d.isActive ? "Pause" : "Activate"}
                      className={`rounded-lg p-2 transition-colors ${
                        d.isActive ? "text-success hover:bg-success/10" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(d)}
                      disabled={isPending}
                      title="Edit"
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {confirmDelete === d.id ? (
                      <>
                        <button
                          onClick={() => remove(d.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-foreground"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(d.id)}
                        disabled={isPending}
                        title="Delete"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {ended && (
                  <p className="mt-3 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                    This offer has ended — it is no longer shown on the site.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
