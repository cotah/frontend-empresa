import { NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Contagem de pendências (ideias + gastos) para badges. */
export async function GET() {
  try {
    const { accountId } = await requireAccount();
    const [ideas, spending] = await Promise.all([
      supabaseSelect("product_ideas", accountId, "select=id&status=eq.pending") as Promise<unknown[]>,
      supabaseSelect("spending_requests", accountId, "select=id&status=eq.pending") as Promise<unknown[]>,
    ]);
    const i = Array.isArray(ideas) ? ideas.length : 0;
    const s = Array.isArray(spending) ? spending.length : 0;
    return NextResponse.json({ ideas: i, spending: s, total: i + s });
  } catch (e) {
    return fail(e);
  }
}
