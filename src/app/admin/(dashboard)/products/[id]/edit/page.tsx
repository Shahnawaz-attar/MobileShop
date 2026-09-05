import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listBrands, listModels, getAdminProduct } from "@/server/modules/catalog";
import { getShop } from "@/server/modules/shop";
import { resolvePublicAppUrl } from "@/lib/qr";
import { ProductForm } from "@/components/admin/ProductForm";
import { WhatsAppStatusGenerator } from "@/components/admin/WhatsAppStatusGenerator";

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

  const publicAppUrl = resolvePublicAppUrl();
  const primaryMedia = product.media[0];

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
        publicAppUrl={publicAppUrl}
      />

      {/* WhatsApp Status poster generator */}
      {product.availability !== "DRAFT" && (
        <div className="mt-6">
          <WhatsAppStatusGenerator
            product={{
              title: product.title,
              storageGb: product.storageGb,
              ramGb: product.ramGb,
              colour: product.colour,
              pricePaise: product.pricePaise,
              mrpPaise: product.mrpPaise,
              condition: product.condition,
              primaryImageUrl: primaryMedia?.url ?? null,
              primaryImageAlt: null,
              slug: product.slug,
            }}
            shop={{
              name: shop.name,
              logoUrl: shop.logoUrl,
              city: shop.city,
              addressLine1: shop.addressLine1,
              whatsapp: shop.whatsapp,
            }}
            productUrl={`${publicAppUrl}/phones/${product.slug}`}
          />
        </div>
      )}
    </div>
  );
}
