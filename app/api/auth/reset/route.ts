import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server/supabase";
import { UpstreamError } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Troca a senha a partir do link de recovery (?code=) ou de sessão já ativa. */
export async function POST(req: NextRequest) {
  try {
    const { code, password } = (await req.json().catch(() => ({}))) as {
      code?: string;
      password?: string;
    };
    if (!password) throw new UpstreamError("Informe a nova senha", 400);

    const supabase = await supabaseServer();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw new UpstreamError("Link inválido ou expirado — peça um novo", 400);
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (error.code === "weak_password") {
        throw new UpstreamError("Senha fraca demais (mínimo 6 caracteres)", 400);
      }
      throw new UpstreamError("Não foi possível trocar a senha, tente de novo", 502);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
