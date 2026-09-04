import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract params
    const title = searchParams.get("title")?.slice(0, 50) || "Premium Pre-Owned Phone";
    const price = searchParams.get("price") || "";
    const image = searchParams.get("image") || "";
    const shop = searchParams.get("shop") || "MobileShop";

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
          {/* Left Side: Text Content */}
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
            {price && (
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
                ₹{price}
              </div>
            )}
          </div>

          {/* Right Side: Product Image */}
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
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    console.log(e instanceof Error ? e.message : String(e));
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
