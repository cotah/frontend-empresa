import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server/supabase";
import { UpstreamError } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/**
 * Cria a conta no Supabase Auth. O gatilho on_auth_user_created (no banco)
 * cria accounts + account_members — o front não cria workspace.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, termsAccepted, marketingOptIn } = (await req
      .json()
      .catch(() => ({}))) as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      termsAccepted?: boolean;
      marketingOptIn?: boolean;
    };
    if (!email || !password || !name?.trim() || !phone?.trim()) {
      throw new UpstreamError("Nome, telefone, e-mail e senha são obrigatórios", 400);
    }
    if (termsAccepted !== true) {
      throw new UpstreamError("É preciso aceitar os Termos & Condições", 400);
    }

    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.nextUrl.origin}/login`,
        // O gatilho no banco grava contact_name, contact_phone,
        // terms_accepted_at e marketing_opt_in na conta a partir daqui.
        data: {
          full_name: name.trim(),
          phone: phone.trim(),
          terms_accepted: true,
          marketing_opt_in: marketingOptIn === true,
        },
      },
    });
    if (error) {
      if (error.code === "user_already_exists") {
        throw new UpstreamError("Este e-mail já tem cadastro — use a tela de login", 409);
      }
      if (error.code === "weak_password") {
        throw new UpstreamError("Senha fraca demais (mínimo 6 caracteres)", 400);
      }
      throw new UpstreamError("Não foi possível criar a conta, tente de novo", 502);
    }
    // Sem session = projeto exige confirmação por e-mail antes do 1º login.
    return NextResponse.json({ ok: true, needsConfirmation: !data.session });
  } catch (e) {
    return fail(e);
  }
}
