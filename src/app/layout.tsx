import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister";
import { Toaster } from "@/components/shared/Toaster";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "MobileShop — Pre-Owned Phones",
    template: "%s | MobileShop",
  },
  description:
    "Browse trusted pre-owned mobile phones with honest condition details, real photos, and verified battery health.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MobileShop",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        {/* Public website is light mode by default. Admin panel forces dark mode in its own layout. */}
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
        <Toaster />
      </body>
    </html>
  );
}
