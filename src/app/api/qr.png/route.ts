import { NextRequest, NextResponse } from "next/server";
import { buildShopQrUrl, renderShopQrPng, resolvePublicAppUrl } from "@/lib/qr";

export async function GET(request: NextRequest) {
  const targetUrl = buildShopQrUrl(resolvePublicAppUrl(request));
  const png = await renderShopQrPng(targetUrl);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}
