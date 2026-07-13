import { NextResponse } from "next/server";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Identidade do usuário logado (Topbar). */
export async function GET() {
  try {
    const { email, workspaceName } = await requireAccount();
    return NextResponse.json({ email, workspace: workspaceName });
  } catch (e) {
    return fail(e);
  }
}
