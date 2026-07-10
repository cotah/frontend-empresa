import { NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Lições aprendidas (agent_learnings). */
export async function GET() {
  try {
    const data = await supabaseSelect(
      "agent_learnings",
      "select=*&order=created_at.desc&limit=100",
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
