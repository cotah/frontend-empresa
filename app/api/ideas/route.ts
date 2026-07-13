import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Lista product_ideas (opcional ?status=pending|approved|rejected). */
export async function GET(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const status = req.nextUrl.searchParams.get("status");
    let query = "select=*&order=created_at.desc&limit=200";
    if (status) query += `&status=eq.${encodeURIComponent(status)}`;
    const data = await supabaseSelect("product_ideas", accountId, query);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
