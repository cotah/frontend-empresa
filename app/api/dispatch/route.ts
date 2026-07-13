import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/**
 * Despacha tarefa pra um agente.
 * Direto: { agent, product?, ...campos } — Inteligente: { message } (HELIOS roteia).
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const body = (await req.json()) as Record<string, unknown>;
    if (!body.agent && !body.message) {
      return NextResponse.json(
        { error: "Envie 'agent' (modo direto) ou 'message' (modo inteligente)" },
        { status: 400 },
      );
    }
    const data = await n8nPost("/capivarex-dispatch", body, accountId);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
