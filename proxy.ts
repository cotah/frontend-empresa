import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

/** Rotas acessíveis sem sessão. */
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Sem APP_PASSWORD configurada => tudo bloqueado (seguro por padrão).
  const password = process.env.APP_PASSWORD;
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const authorized = !!password && !!cookie && cookie === (await sessionToken(password));

  if (authorized) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Protege tudo, exceto assets estáticos do Next.
  matcher: ["/((?!_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
