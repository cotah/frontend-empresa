import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Lista spending_requests (opcional ?status=). */
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    let query = "select=*&order=requested_at.desc&limit=200";
    if (status) query += `&status=eq.${encodeURIComponent(status)}`;
    const data = await supabaseSelect("spending_requests", query);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
