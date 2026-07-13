import { NextRequest, NextResponse } from "next/server";
import { cfoFetch } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** CFO devolve números como string ("20") — coage pra number (null/lixo => 0). */
function num(x: unknown): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

/** Garante o shape numérico de CfoSummary (lib/types.ts) — somas e gráficos seguros. */
function normalizeSummary(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  const byCurrency: Record<string, unknown> = {};
  for (const [cur, v] of Object.entries((obj.by_currency as Record<string, unknown>) ?? {})) {
    byCurrency[cur] =
      v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, num(val)]),
          )
        : num(v);
  }

  const pending = (obj.pending_classification as Record<string, unknown>) ?? {};

  return {
    ...obj,
    total_gross: num(obj.total_gross),
    total_company_share: num(obj.total_company_share),
    total_pro_labore_share: num(obj.total_pro_labore_share),
    transaction_count: num(obj.transaction_count),
    pending_spending_requests: num(obj.pending_spending_requests),
    by_currency: byCurrency,
    pending_classification: { ...pending, count: num(pending.count), total_gross: num(pending.total_gross) },
  };
}

/** Resumo financeiro real do CFO (?product_slug=&since= opcionais). */
export async function GET(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const params = new URLSearchParams();
    const productSlug = req.nextUrl.searchParams.get("product_slug");
    const since = req.nextUrl.searchParams.get("since");
    if (productSlug) params.set("product_slug", productSlug);
    if (since) params.set("since", since);
    const qs = params.toString();
    const data = await cfoFetch(`/reports/summary${qs ? `?${qs}` : ""}`, accountId);
    return NextResponse.json(normalizeSummary(data));
  } catch (e) {
    return fail(e);
  }
}
