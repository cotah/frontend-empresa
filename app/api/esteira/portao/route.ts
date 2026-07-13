import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";
import type { Decision } from "@/lib/types";

/** Decide um portão da esteira; aprovar destrava o `avancar` seguinte. */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const { run_id, gate, decision, note } = (await req.json()) as {
      run_id?: string;
      gate?: string;
      decision?: Decision;
      note?: string;
    };
    if (!run_id?.trim() || !gate?.trim()) {
      return NextResponse.json(
        { error: "Campos 'run_id' e 'gate' são obrigatórios" },
        { status: 400 },
      );
    }
    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json(
        { error: "Campo 'decision' deve ser 'approved' ou 'rejected'" },
        { status: 400 },
      );
    }
    const data = await n8nPost(
      "/capivarex-esteira-portao",
      { run_id, gate, decision, ...(note?.trim() ? { note: note.trim() } : {}) },
      accountId,
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
