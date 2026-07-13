import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Explode a criação do run em peças (idempotente); devolve {count, assets[]}. */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const { run_id } = (await req.json()) as { run_id?: string };
    if (!run_id?.trim()) {
      return NextResponse.json({ error: "Campo 'run_id' é obrigatório" }, { status: 400 });
    }
    const data = await n8nPost("/capivarex-review-preparar", { run_id }, accountId);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
