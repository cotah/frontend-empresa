import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Decide um pedido de gasto (> €50 ou moeda estrangeira). */
export async function POST(req: NextRequest) {
  try {
    const { request_id, decision, note } = (await req.json()) as {
      request_id?: string;
      decision?: string;
      note?: string;
    };
    if (!request_id || !["approved", "rejected"].includes(decision ?? "")) {
      return NextResponse.json(
        { error: "Body precisa de request_id e decision (approved|rejected)" },
        { status: 400 },
      );
    }
    const body: Record<string, unknown> = { request_id, decision };
    if (note?.trim()) body.note = note.trim();
    const data = await n8nPost("/capivarex-cfo-decidir", body);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
