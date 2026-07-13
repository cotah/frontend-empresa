import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Reunião com o HELIOS (CEO). Demora ~5-15s. */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const { message, product } = (await req.json()) as { message?: string; product?: string };
    if (!message?.trim()) {
      return NextResponse.json({ error: "Campo 'message' é obrigatório" }, { status: 400 });
    }
    const data = await n8nPost(
      "/capivarex-ceo-chat",
      product ? { message, product } : { message },
      accountId,
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
