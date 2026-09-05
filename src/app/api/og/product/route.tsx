import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ogSafeCloudinaryUrl } from "@/lib/image";

export const runtime = "edge";

function formatOgPrice(price: string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  return n.toLocaleString("en-IN");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title")?.slice(0, 60) || "Premium Pre-Owned Phone";
    const price = searchParams.get("price") || "";
    const image = searchParams.get("image") ? ogSafeCloudinaryUrl(searchParams.get("image")!) : "";
    const shop = searchParams.get("shop") || "MobileShop";
    const imageW = Number(searchParams.get("imageW")) || 800;
    const imageH = Number(searchParams.get("imageH")) || 800;
    const variant = searchParams.get("variant") || "share";
    const priceLabel = price ? `₹${formatOgPrice(price)}` : "";

    if (variant === "status") {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#0a0a0a",
              color: "white",
              padding: "48px",
              fontFamily: "sans-serif",
            }}
          >
            <p
              style={{
                fontSize: 28,
                color: "#a3a3a3",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                margin: 0,
              }}
            >
              {shop}
            </p>

            <div
              style={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                margin: "32px 0",
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt={title}
                  width={imageW}
                  height={imageH}
                  style={{
                    objectFit: "contain",
                    maxHeight: "920px",
                    width: "100%",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "720px",
                    backgroundColor: "#222",
                    borderRadius: "32px",
                  }}
                />
              )}
            </div>

            <h1
              style={{
                fontSize: 52,
                fontWeight: 800,
                lineHeight: 1.15,
                margin: 0,
                marginBottom: 24,
              }}
            >
              {title}
            </h1>

            {priceLabel ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  padding: "14px 36px",
                  borderRadius: "100px",
                  fontSize: 44,
                  fontWeight: "bold",
                  width: "fit-content",
                }}
              >
                {priceLabel}
              </div>
            ) : null}
          </div>
        ),
        { width: 1080, height: 1920 }
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0a0a0a",
            color: "white",
            padding: "40px",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: "55%",
              height: "100%",
            }}
          >
            <h2
              style={{
                fontSize: 32,
                color: "#888888",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 20,
              }}
            >
              {shop}
            </h2>
            <h1
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 20,
                color: "#ffffff",
              }}
            >
              {title}
            </h1>
            {priceLabel ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  padding: "10px 30px",
                  borderRadius: "100px",
                  fontSize: 48,
                  fontWeight: "bold",
                  width: "fit-content",
                }}
              >
                {priceLabel}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              width: "40%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {image ? (
              <img
                src={image}
                alt={title}
                width={imageW}
                height={imageH}
                style={{
                  objectFit: "contain",
                  width: "100%",
                  height: "100%",
                  borderRadius: "20px",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#222",
                  borderRadius: "20px",
                }}
              />
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: unknown) {
    console.log(e instanceof Error ? e.message : String(e));
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
