"use client";

import { useState, useTransition } from "react";
import { createBrandAction, createModelAction } from "@/server/modules/catalog/actions";
import { DEVICE_TYPE_LABELS } from "@/lib/constants";
import type { BrandOption, DeviceType, ModelOption } from "@/types";

const DEVICE_TYPE_OPTIONS: DeviceType[] = ["PHONE", "TABLET", "OTHER"];

const inputClass =
  "block w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background disabled:cursor-not-allowed disabled:opacity-50";
const labelClass = "block text-sm font-semibold text-foreground mb-1.5";

interface BrandModelPickerProps {
  deviceType: DeviceType;
  brandId: string;
  modelId: string;
  brands: BrandOption[];
  models: ModelOption[];
  onDeviceTypeChange: (value: DeviceType) => void;
  onBrandIdChange: (value: string) => void;
  onModelIdChange: (value: string) => void;
  onBrandCreated: (brand: BrandOption) => void;
  onModelCreated: (model: ModelOption) => void;
  onSuggestTitle: (title: string) => void;
}

export function BrandModelPicker({
  deviceType,
  brandId,
  modelId,
  brands,
  models,
  onDeviceTypeChange,
  onBrandIdChange,
  onModelIdChange,
  onBrandCreated,
  onModelCreated,
  onSuggestTitle,
}: BrandModelPickerProps) {
  const [isPending, startTransition] = useTransition();
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [showNewModel, setShowNewModel] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const filteredModels = models.filter(
    (m) => m.brandId === brandId && m.deviceType === deviceType
  );
  const selectedBrand = brands.find((b) => b.id === brandId);

  function handleDeviceTypeChange(value: DeviceType) {
    onDeviceTypeChange(value);
    onModelIdChange("");
    setShowNewModel(false);
    setLocalError(null);
  }

  function handleBrandChange(value: string) {
    onBrandIdChange(value);
    onModelIdChange("");
    setShowNewModel(false);
    setLocalError(null);
  }

  function handleModelChange(value: string) {
    onModelIdChange(value);
    const model = filteredModels.find((m) => m.id === value);
    if (model) {
      onSuggestTitle(model.name);
    }
  }

  function addBrand() {
    const name = newBrandName.trim();
    if (!name) {
      setLocalError("Enter a brand name");
      return;
    }
    startTransition(async () => {
      setLocalError(null);
      const result = await createBrandAction(name);
      if (!result.success) {
        setLocalError(result.error);
        return;
      }
      onBrandCreated(result.data);
      onBrandIdChange(result.data.id);
      onModelIdChange("");
      setNewBrandName("");
      setShowNewBrand(false);
    });
  }

  function addModel() {
    const name = newModelName.trim();
    if (!brandId) {
      setLocalError("Select or add a brand first");
      return;
    }
    if (!name) {
      setLocalError("Enter a model name");
      return;
    }
    startTransition(async () => {
      setLocalError(null);
      const result = await createModelAction({
        brandId,
        name,
        deviceType,
      });
      if (!result.success) {
        setLocalError(result.error);
        return;
      }
      onModelCreated(result.data);
      onModelIdChange(result.data.id);
      onSuggestTitle(result.data.name);
      setNewModelName("");
      setShowNewModel(false);
    });
  }

  return (
    <>
      <div className="space-y-2 sm:col-span-2">
        <label htmlFor="deviceType" className={labelClass}>
          Device type <span className="text-destructive">*</span>
        </label>
        <select
          id="deviceType"
          value={deviceType}
          onChange={(e) => handleDeviceTypeChange(e.target.value as DeviceType)}
          required
          className={inputClass}
        >
          {DEVICE_TYPE_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DEVICE_TYPE_LABELS[d]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Independent of brand. Phones and tablets share battery, storage, and RAM. Other
          devices (watches, earbuds) only need the basics.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="brand" className={labelClass}>
          Brand <span className="text-destructive">*</span>
        </label>
        <select
          id="brand"
          value={brandId}
          onChange={(e) => handleBrandChange(e.target.value)}
          required
          disabled={isPending}
          className={inputClass}
        >
          <option value="">Select brand</option>
          {brands
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {!showNewBrand ? (
          <button
            type="button"
            onClick={() => {
              setShowNewBrand(true);
              setLocalError(null);
            }}
            className="min-h-11 text-sm font-semibold text-primary hover:underline"
          >
            + Add new brand
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="e.g. Xiaomi"
              className={inputClass}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addBrand}
                disabled={isPending}
                className="min-h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Save brand
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewBrand(false);
                  setNewBrandName("");
                }}
                className="min-h-11 shrink-0 px-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="model" className={labelClass}>
          Model
        </label>
        <select
          id="model"
          value={modelId}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={!brandId || isPending}
          className={inputClass}
        >
          <option value="">
            {brandId
              ? `Select ${DEVICE_TYPE_LABELS[deviceType].toLowerCase()} model`
              : "Select a brand first"}
          </option>
          {filteredModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {!brandId ? (
          <p className="text-xs text-muted-foreground">Models are tied to the brand you pick.</p>
        ) : !showNewModel ? (
          <button
            type="button"
            onClick={() => {
              setShowNewModel(true);
              setLocalError(null);
            }}
            className="min-h-11 text-sm font-semibold text-primary hover:underline"
          >
            + Add {DEVICE_TYPE_LABELS[deviceType].toLowerCase()} model
            {selectedBrand ? ` for ${selectedBrand.name}` : ""}
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder={
                deviceType === "PHONE"
                  ? "e.g. Redmi Note 13"
                  : deviceType === "TABLET"
                    ? "e.g. Redmi Pad"
                    : "e.g. Watch 2"
              }
              className={inputClass}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addModel}
                disabled={isPending}
                className="min-h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Save model
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewModel(false);
                  setNewModelName("");
                }}
                className="min-h-11 shrink-0 px-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {localError && (
        <p className="text-sm text-destructive sm:col-span-2" role="alert">
          {localError}
        </p>
      )}
    </>
  );
}
