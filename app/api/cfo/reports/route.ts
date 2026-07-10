import { NextRequest, NextResponse } from "next/server";
import { cfoFetch } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Resumo financeiro real do CFO (?product_slug=&since= opcionais). */
export async function GET(req: NextRequest) {
  try {
    const params = new URLSearchParams();
    const productSlug = req.nextUrl.searchParams.get("product_slug");
    const since = req.nextUrl.searchParams.get("since");
    if (productSlug) params.set("product_slug", productSlug);
    if (since) params.set("since", since);
    const qs = params.toString();
    const data = await cfoFetch(`/reports/summary${qs ? `?${qs}` : ""}`);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
