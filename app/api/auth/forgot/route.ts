import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";
import { UpstreamError } from "@/lib/server/upstream";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json().catch(() => ({}))) as { email?: string };
    if (!email) throw new UpstreamError("Informe o e-mail", 400);

    const supabase = await supabaseServer();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.nextUrl.origin}/redefinir`,
    });
    // Sempre ok: não vazamos se o e-mail existe ou não.
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
