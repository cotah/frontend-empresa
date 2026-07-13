import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Portões da esteira (gate_approvals), filtráveis por ?run_id= e ?status=. */
export async function GET(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const runId = req.nextUrl.searchParams.get("run_id");
    const status = req.nextUrl.searchParams.get("status");
    let query = "select=*&order=created_at.desc&limit=50";
    if (runId) query += `&run_id=eq.${encodeURIComponent(runId)}`;
    if (status) query += `&status=eq.${encodeURIComponent(status)}`;
    const data = await supabaseSelect("gate_approvals", accountId, query);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
