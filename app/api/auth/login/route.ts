import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server/supabase";
import { UpstreamError } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      throw new UpstreamError("E-mail e senha são obrigatórios", 400);
    }

    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === "email_not_confirmed") {
        throw new UpstreamError("Confirme seu e-mail antes de entrar (veja sua caixa de entrada)", 401);
      }
      throw new UpstreamError("E-mail ou senha incorretos", 401);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
