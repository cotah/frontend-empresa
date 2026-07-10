import { NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Roster de agentes (agent_registry). */
export async function GET() {
  try {
    const data = await supabaseSelect(
      "agent_registry",
      "select=*&order=category.asc,name.asc&limit=200",
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
