import { NextRequest, NextResponse } from "next/server";
import { cfoFetch } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Pergunta livre ao ATLAS (CFO). */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const { question } = (await req.json()) as { question?: string };
    if (!question?.trim()) {
      return NextResponse.json({ error: "Campo 'question' é obrigatório" }, { status: 400 });
    }
    const data = await cfoFetch("/atlas/ask", accountId, { method: "POST", body: { question } });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
