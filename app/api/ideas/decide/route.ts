import { NextRequest, NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Decide uma ideia (aprovar dispara o Branding no backend). */
export async function POST(req: NextRequest) {
  try {
    const { request_id, decision } = (await req.json()) as {
      request_id?: string;
      decision?: string;
    };
    if (!request_id || !["approved", "rejected"].includes(decision ?? "")) {
      return NextResponse.json(
        { error: "Body precisa de request_id e decision (approved|rejected)" },
        { status: 400 },
      );
    }
    const data = await n8nPost("/capivarex-ideia-decidir", { request_id, decision });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
