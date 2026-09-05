import { NextRequest, NextResponse } from "next/server";
import { searchSuggestions } from "@/server/modules/catalog";

/**
 * GET /api/search/suggest?q=pix
 * Lightweight autocomplete suggestions for the public search box.
 * Returns live products + matching brands + models.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ products: [], brands: [], models: [] });
  }
  if (q.length > 60) {
    return NextResponse.json({ products: [], brands: [], models: [] });
  }

  try {
    const suggestions = await searchSuggestions(q);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Search suggestions failed:", error);
    return NextResponse.json({ products: [], brands: [], models: [] });
  }
}
