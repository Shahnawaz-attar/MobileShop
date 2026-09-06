import type { Metadata } from "next";
import { requireOwner } from "@/server/auth/guards";
import { listDiscounts } from "@/server/modules/discounts";
import { listBrands } from "@/server/modules/catalog";
import { db } from "@/server/db/client";
import { DiscountManager } from "@/components/admin/DiscountManager";

export const metadata: Metadata = {
  title: "Discounts",
};

export default async function AdminDiscountsPage() {
  await requireOwner();

  // Lightweight fetch of AVAILABLE products (id/title/brand) for the picker —
  // avoids the heavier admin list + fuzzy search path.
  const [discounts, brands, productRows] = await Promise.all([
    listDiscounts(),
    listBrands(),
    db.product.findMany({
      where: { availability: "AVAILABLE" },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        brand: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Discounts</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Run timed offers — e.g. &quot;Diwali Sale: 20% off Apple &amp; Samsung&quot; or a deal on
          specific phones. A discount can cover several brands or several products at once. The sale
          price shows on the site automatically between the start and end time.
        </p>
      </div>

      <DiscountManager
        discounts={discounts.map((d) => ({
          id: d.id,
          label: d.label,
          percent: d.percent,
          brandIds: d.brands.map((b) => b.id),
          productIds: d.products.map((p) => p.id),
          brandNames: d.brands.map((b) => b.name),
          productTitles: d.products.map((p) => p.title),
          startsAt: d.startsAt.toISOString(),
          endsAt: d.endsAt.toISOString(),
          isActive: d.isActive,
        }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
        products={productRows.map((p) => ({
          id: p.id,
          title: p.title,
          brandName: p.brand.name,
        }))}
      />
    </div>
  );
}


