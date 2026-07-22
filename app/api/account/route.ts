import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminSelect, updateAccount, UpstreamError } from "@/lib/server/upstream";
import { requireAccount, invalidateMembership } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Dados da empresa (accounts) — prefill das Configurações. */
export async function GET() {
  try {
    const { accountId } = await requireAccount();
    const rows = (await supabaseAdminSelect(
      "accounts",
      `select=name,country,city,website&id=eq.${encodeURIComponent(accountId)}&limit=1`,
    )) as Array<{
      name: string;
      country: string | null;
      city: string | null;
      website: string | null;
    }>;
    const account = rows[0];
    if (!account) throw new UpstreamError("Conta não encontrada", 404);
    return NextResponse.json(account);
  } catch (e) {
    return fail(e);
  }
}

/** Edita a empresa. Nada obrigatório; nome vazio mantém o atual (coluna NOT NULL). */
export async function PATCH(req: NextRequest) {
  try {
    const { userId, accountId } = await requireAccount();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = clean(body.name);

    await updateAccount(accountId, {
      ...(name ? { name } : {}),
      country: clean(body.country),
      city: clean(body.city),
      website: clean(body.website),
    });

    invalidateMembership(userId); // topbar mostra o nome novo da empresa já
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
