import { NextResponse } from "next/server";
import { n8nPost } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Oportunidades garimpadas pela Busca (via ponte n8n). */
export async function GET() {
  try {
    const data = await n8nPost("/capivarex-busca", { action: "list" });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
