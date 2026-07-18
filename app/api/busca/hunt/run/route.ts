import { NextResponse } from "next/server";
import { buscaFetch } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Dispara uma rodada do Caçador de Oportunidades agora (gasta Caps). */
export async function POST() {
  try {
    const { accountId } = await requireAccount();
    const data = await buscaFetch("/hunt/run", accountId, "control", { method: "POST" });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
