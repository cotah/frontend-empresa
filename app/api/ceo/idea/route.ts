import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Modo Ideia: o CEO avalia (go/no-go) e, se go, registra + cria marca. */
export async function POST(req: NextRequest) {
  try {
    const { idea } = (await req.json()) as { idea?: string };
    if (!idea?.trim()) {
      return NextResponse.json({ error: "Campo 'idea' é obrigatório" }, { status: 400 });
    }
    const data = await n8nPost("/capivarex-orchestrator", { idea });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
