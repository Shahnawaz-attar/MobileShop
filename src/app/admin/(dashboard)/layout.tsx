import { requireOwner } from "@/server/auth/guards";
import { getShop } from "@/server/modules/shop";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { AdminPullToRefresh } from "@/components/admin/AdminPullToRefresh";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [owner, shop] = await Promise.all([requireOwner(), getShop()]);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar ownerName={owner.name} ownerEmail={owner.email} shopName={shop.name} dashboardLogoUrl={shop.dashboardLogoUrl} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <AdminMobileHeader shopName={shop.name} dashboardLogoUrl={shop.dashboardLogoUrl} />
        <AdminPullToRefresh>
          <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6 flex-1 w-full">
            {children}
          </div>
        </AdminPullToRefresh>
      </main>
      <AdminMobileNav />
    </div>
  );
}
