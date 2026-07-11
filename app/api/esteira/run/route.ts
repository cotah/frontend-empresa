import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Um run da esteira por id (lê orchestration_runs). */
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Parâmetro 'id' é obrigatório" }, { status: 400 });
    }
    const rows = await supabaseSelect(
      "orchestration_runs",
      `select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    );
    const run = Array.isArray(rows) ? rows[0] : null;
    if (!run) {
      return NextResponse.json({ error: "Run não encontrado" }, { status: 404 });
    }
    return NextResponse.json(run);
  } catch (e) {
    return fail(e);
  }
}
