import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/**
 * Máximo do plano Hobby. A fase Criação (8 agentes, ~10-12 min) pode estourar
 * esse teto — o n8n segue rodando e a tela acompanha via polling do run.
 */
export const maxDuration = 300;

/** Roda a próxima fase do run e para no portão seguinte (status awaiting_gate). */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const { run_id } = (await req.json()) as { run_id?: string };
    if (!run_id?.trim()) {
      return NextResponse.json({ error: "Campo 'run_id' é obrigatório" }, { status: 400 });
    }
    const data = await n8nPost("/capivarex-esteira-avancar", { run_id }, accountId);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
