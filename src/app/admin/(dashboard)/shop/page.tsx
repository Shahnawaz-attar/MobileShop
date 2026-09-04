import { getShop } from "@/server/modules/shop";
import { ShopSettingsForm } from "@/components/admin/ShopSettingsForm";

export const metadata = {
  title: "Shop Settings",
};

export default async function ShopSettingsPage() {
  const shop = await getShop();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Shop Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your shop details. Changes will appear on the public website instantly.
        </p>
      </div>
      <ShopSettingsForm shop={shop} />
    </div>
  );
}
