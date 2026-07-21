/**
 * Sessão Supabase no servidor (BFF). O browser nunca fala com o Supabase:
 * a sessão vive em cookies httpOnly geridos aqui e o refresh acontece no proxy.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { need, supabaseAdminSelect, UpstreamError } from "./upstream";

/** Client Supabase server-side amarrado aos cookies da request atual. */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(need("SUPABASE_URL"), need("SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de um Server Component (sem resposta mutável).
          // Sem problema: o refresh de token é responsabilidade do proxy.
        }
      },
    },
  });
}

export type AccountContext = {
  userId: string;
  email: string;
  accountId: string;
  workspaceName: string;
};

// Cache em memória do vínculo user → workspace (evita 2 fetches em todo request).
const MEMBERSHIP_TTL_MS = 5 * 60 * 1000;
const membershipCache = new Map<
  string,
  { accountId: string; workspaceName: string; expiresAt: number }
>();

/**
 * Exige usuário logado e devolve o contexto da conta dele.
 * 401 se não autenticado; 403 se não tem workspace vinculado.
 */
export async function requireAccount(): Promise<AccountContext> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) throw new UpstreamError("Não autenticado", 401);

  const userId = claims.sub;
  const email = typeof claims.email === "string" ? claims.email : "";

  const cached = membershipCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return { userId, email, accountId: cached.accountId, workspaceName: cached.workspaceName };
  }

  // account_members/accounts são infraestrutura — únicas leituras sem escopo.
  const members = (await supabaseAdminSelect(
    "account_members",
    `select=account_id&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
  )) as Array<{ account_id: string }>;
  const accountId = members[0]?.account_id;
  if (!accountId) throw new UpstreamError("Usuário sem workspace vinculado", 403);

  const accounts = (await supabaseAdminSelect(
    "accounts",
    `select=name&id=eq.${encodeURIComponent(accountId)}&limit=1`,
  )) as Array<{ name: string }>;
  const workspaceName = accounts[0]?.name ?? "Workspace";

  membershipCache.set(userId, {
    accountId,
    workspaceName,
    expiresAt: Date.now() + MEMBERSHIP_TTL_MS,
  });
  return { userId, email, accountId, workspaceName };
}

/** Derruba o cache do vínculo (ex.: onboarding renomeou a empresa → topbar atualiza já). */
export function invalidateMembership(userId: string) {
  membershipCache.delete(userId);
}

// Contas que JÁ concluíram o onboarding — estado que nunca reverte, então o
// cache não tem TTL. Conta pendente não entra aqui (revalida a cada request).
const onboardedCache = new Set<string>();

/** true se a conta já concluiu o onboarding (accounts.onboarding_completed_at ≠ null). */
export async function isOnboarded(accountId: string): Promise<boolean> {
  if (onboardedCache.has(accountId)) return true;
  const rows = (await supabaseAdminSelect(
    "accounts",
    `select=onboarding_completed_at&id=eq.${encodeURIComponent(accountId)}&limit=1`,
  )) as Array<{ onboarding_completed_at: string | null }>;
  const done = !!rows[0]?.onboarding_completed_at;
  if (done) onboardedCache.add(accountId);
  return done;
}

/** Marca a conta como onboarded no cache local (chamado logo após gravar no banco). */
export function markOnboarded(accountId: string) {
  onboardedCache.add(accountId);
}
