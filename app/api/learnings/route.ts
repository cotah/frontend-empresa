import { NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Lições aprendidas (agent_learnings). */
export async function GET() {
  try {
    const { accountId } = await requireAccount();
    const data = await supabaseSelect(
      "agent_learnings",
      accountId,
      "select=*&order=created_at.desc&limit=100",
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
