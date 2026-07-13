import { NextResponse } from "next/server";
import { supabaseAdminSelect } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Roster de agentes (agent_registry). */
export async function GET() {
  try {
    // agent_registry é catálogo GLOBAL (sem account_id) — requireAccount só
    // protege a rota; a leitura é a exceção documentada via supabaseAdminSelect.
    await requireAccount();
    const data = await supabaseAdminSelect(
      "agent_registry",
      "select=*&order=category.asc,name.asc&limit=200",
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
