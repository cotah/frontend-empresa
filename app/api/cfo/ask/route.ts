import { NextRequest, NextResponse } from "next/server";
import { cfoFetch } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Pergunta livre ao ATLAS (CFO). */
export async function POST(req: NextRequest) {
  try {
    const { question } = (await req.json()) as { question?: string };
    if (!question?.trim()) {
      return NextResponse.json({ error: "Campo 'question' é obrigatório" }, { status: 400 });
    }
    const data = await cfoFetch("/atlas/ask", { method: "POST", body: { question } });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
