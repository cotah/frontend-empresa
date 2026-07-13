import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Peças da criação (creation_assets) de um run, na ordem em que foram geradas. */
export async function GET(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const runId = req.nextUrl.searchParams.get("run_id");
    if (!runId) {
      return NextResponse.json({ error: "Parâmetro 'run_id' é obrigatório" }, { status: 400 });
    }
    const data = await supabaseSelect(
      "creation_assets",
      accountId,
      `select=*&run_id=eq.${encodeURIComponent(runId)}&order=created_at.asc`,
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
