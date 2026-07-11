import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** A fase Criação roda 8 agentes (~10-12 min) — sem isso a function estoura os 300s default. */
export const maxDuration = 800;

/** Roda a próxima fase do run e para no portão seguinte (status awaiting_gate). */
export async function POST(req: NextRequest) {
  try {
    const { run_id } = (await req.json()) as { run_id?: string };
    if (!run_id?.trim()) {
      return NextResponse.json({ error: "Campo 'run_id' é obrigatório" }, { status: 400 });
    }
    const data = await n8nPost("/capivarex-esteira-avancar", { run_id });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
