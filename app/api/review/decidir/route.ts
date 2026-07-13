import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";
import type { Decision } from "@/lib/types";

/** Aprova/rejeita uma peça da criação; só approved vai pro ar na Publicação. */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const { asset_id, decision, note } = (await req.json()) as {
      asset_id?: string;
      decision?: Decision;
      note?: string;
    };
    if (!asset_id?.trim()) {
      return NextResponse.json({ error: "Campo 'asset_id' é obrigatório" }, { status: 400 });
    }
    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json(
        { error: "Campo 'decision' deve ser 'approved' ou 'rejected'" },
        { status: 400 },
      );
    }
    const data = await n8nPost(
      "/capivarex-review-decidir",
      { asset_id, decision, ...(note?.trim() ? { note: note.trim() } : {}) },
      accountId,
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
