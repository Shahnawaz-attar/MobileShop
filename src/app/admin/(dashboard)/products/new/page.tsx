import type { Metadata } from "next";
import { listBrands, listModels } from "@/server/modules/catalog";
import { getShop } from "@/server/modules/shop";
import { resolvePublicAppUrl } from "@/lib/qr";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Add Device",
};

export default async function NewProductPage() {
  const [brands, models, shop] = await Promise.all([listBrands(), listModels(), getShop()]);
  const publicAppUrl = resolvePublicAppUrl();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Add a device
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the essentials and your device is ready to publish.
        </p>
      </div>

      <ProductForm
        brands={brands}
        models={models}
        product={null}
        shopName={shop.name}
        publicAppUrl={publicAppUrl}
      />
    </div>
  );
}
