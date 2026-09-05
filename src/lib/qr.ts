import QRCode from "qrcode";

function isLocalHostUrl(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

/**
 * Public site origin for QR.
 * Prefers NEXT_PUBLIC_APP_URL when it is not localhost (set this on Vercel).
 */
export function resolvePublicAppUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (fromEnv && !isLocalHostUrl(fromEnv)) {
    return fromEnv;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? (isLocalHostUrl(request.url) ? "http" : "https");
    if (host && !isLocalHostUrl(host)) {
      return `${proto}://${host}`;
    }
  }

  return fromEnv || "http://localhost:3000";
}

/**
 * Public URL encoded in the shop QR (homepage, not /phones).
 * utm_source=qr lets insights count QR landings.
 */
export function buildShopQrUrl(appUrl: string): string {
  const url = new URL(appUrl);
  url.searchParams.set("utm_source", "qr");
  return url.toString();
}

export async function renderShopQrPng(targetUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(targetUrl, {
    type: "png",
    errorCorrectionLevel: "H",
    width: 1024,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
}
