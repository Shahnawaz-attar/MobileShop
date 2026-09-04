import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/auth/actions";

interface AdminMobileHeaderProps {
  shopName: string;
  dashboardLogoUrl: string | null;
}

export function AdminMobileHeader({ shopName, dashboardLogoUrl }: AdminMobileHeaderProps) {
  const effectiveLogoUrl = dashboardLogoUrl;
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          {effectiveLogoUrl ? (
            <img 
              src={effectiveLogoUrl} 
              alt={shopName} 
              className="h-8 w-auto max-w-[120px] rounded-md object-contain" 
            />
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <span className="text-sm font-bold">📱</span>
              </div>
              <span className="text-base font-bold text-foreground tracking-tight">
                {shopName}
              </span>
            </>
          )}
          <span className="ml-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
            Admin
          </span>
        </Link>
        
        <form action={logoutAction} className="flex">
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
