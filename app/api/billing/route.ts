import { NextResponse } from "next/server";
import { supabaseAdminSelect } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Saldo de Caps e plano da conta logada. */
export async function GET() {
  try {
    const { accountId } = await requireAccount();
    // accounts é infraestrutura (lookup da própria conta) — leitura via admin.
    const rows = (await supabaseAdminSelect(
      "accounts",
      `select=caps_balance,plan&id=eq.${encodeURIComponent(accountId)}&limit=1`,
    )) as Array<{ caps_balance: number | null; plan: string | null }>;
    const account = rows[0];
    return NextResponse.json({
      capsBalance: account?.caps_balance ?? 0,
      plan: account?.plan ?? "starter",
    });
  } catch (e) {
    return fail(e);
  }
}
