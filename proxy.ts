import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Rotas acessíveis sem sessão. */
const PUBLIC_PATHS = ["/login", "/cadastro", "/esqueci-senha", "/redefinir", "/api/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function deny(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sem env vars do Supabase => tudo bloqueado, menos as públicas (seguro por padrão).
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return isPublic(pathname) ? NextResponse.next() : deny(req);
  }

  // Padrão @supabase/ssr pra middleware: o setAll recria a response com os
  // cookies novos — é isso que persiste o refresh de um token expirado.
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const authenticated = !!data?.claims?.sub;

  // Logado não tem o que fazer em /login ou /cadastro. (/redefinir fica de fora:
  // o link de recovery loga o usuário ANTES de ele trocar a senha.)
  if (authenticated && (pathname === "/login" || pathname === "/cadastro")) {
    const home = req.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  if (authenticated || isPublic(pathname)) return res;
  return deny(req);
}

export const config = {
  // Protege tudo, exceto assets estáticos do Next.
  matcher: ["/((?!_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
