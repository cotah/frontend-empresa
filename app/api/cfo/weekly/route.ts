import { NextResponse } from "next/server";
import { cfoFetch } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Relatório semanal do ATLAS. */
export async function GET() {
  try {
    const { accountId } = await requireAccount();
    const data = await cfoFetch("/atlas/report/weekly", accountId);
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
