import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listBrands, listModels, getAdminProduct } from "@/server/modules/catalog";
import { getShop } from "@/server/modules/shop";
import { resolvePublicAppUrl } from "@/lib/qr";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Edit Device",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [brands, models, product, shop] = await Promise.all([
    listBrands(),
    listModels(),
    getAdminProduct(id),
    getShop(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit device
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details for {product.title}.
        </p>
      </div>

      <ProductForm
        brands={brands}
        models={models}
        product={product}
        shopName={shop.name}
        publicAppUrl={resolvePublicAppUrl()}
      />
    </div>
  );
}
