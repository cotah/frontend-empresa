import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Atividade da empresa (work_log). ?limit= opcional (padrão 50, máx 200). */
export async function GET(req: NextRequest) {
  try {
    const raw = Number(req.nextUrl.searchParams.get("limit") ?? 50);
    const limit = Math.min(Math.max(Number.isNaN(raw) ? 50 : raw, 1), 200);
    const data = await supabaseSelect("work_log", `select=*&order=created_at.desc&limit=${limit}`);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
