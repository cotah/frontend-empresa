import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Dispara o lançamento de um produto na esteira. */
export async function POST(req: NextRequest) {
  try {
    const { product_name } = (await req.json()) as { product_name?: string };
    if (!product_name?.trim()) {
      return NextResponse.json({ error: "Campo 'product_name' é obrigatório" }, { status: 400 });
    }
    const data = await n8nPost("/capivarex-orchestrator", { product_name });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
