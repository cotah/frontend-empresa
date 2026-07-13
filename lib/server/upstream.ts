/**
 * Camada BFF: único lugar do projeto que fala com n8n / CFO / Busca / Supabase.
 * Todas as chaves vêm de env vars do SERVIDOR — nada disso chega ao browser.
 */

export class UpstreamError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
    this.name = "UpstreamError";
  }
}

export function need(name: string): string {
  const value = process.env[name];
  if (!value) throw new UpstreamError(`Env var ${name} não configurada no servidor`, 500);
  return value;
}

async function jsonOrThrow(res: Response, label: string): Promise<unknown> {
  const text = await res.text();
  if (!res.ok) {
    throw new UpstreamError(`${label} respondeu ${res.status}: ${text.slice(0, 300)}`);
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGRA DE OURO DO MULTI-TENANT: a service key ignora o RLS, então o isolamento
// é responsabilidade DESTA camada. Nenhuma query sai daqui sem o account_id do
// usuário logado — por isso as funções abaixo EXIGEM accountId na assinatura.
// ─────────────────────────────────────────────────────────────────────────────

/** Anexa account_id como query param (respeita ? já existente no path). */
function withAccountParam(path: string, accountId: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}account_id=${encodeURIComponent(accountId)}`;
}

/** POST num webhook do n8n (CEO, gates, pontes, dispatch) — account_id sempre no corpo. */
export async function n8nPost(
  path: string,
  body: Record<string, unknown>,
  accountId: string,
): Promise<unknown> {
  const res = await fetch(`${need("N8N_BASE")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, account_id: accountId }),
    cache: "no-store",
  });
  return jsonOrThrow(res, `n8n ${path}`);
}

/** Chamada ao CFO Railway (FastAPI) — account_id no corpo (POST) ou na query (GET). */
export async function cfoFetch(
  path: string,
  accountId: string,
  init?: { method?: string; body?: Record<string, unknown> },
): Promise<unknown> {
  const hasBody = init?.body !== undefined;
  const url = `${need("CFO_BASE")}${hasBody ? path : withAccountParam(path, accountId)}`;
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": need("CFO_API_KEY"),
    },
    body: hasBody ? JSON.stringify({ ...init.body, account_id: accountId }) : undefined,
    cache: "no-store",
  });
  return jsonOrThrow(res, `CFO ${path}`);
}

/** Chamada ao backend Busca Railway com X-API-Key (read ou control). */
export async function buscaFetch(
  path: string,
  accountId: string,
  auth: "read" | "control" = "read",
  init?: { method?: string; body?: Record<string, unknown> },
): Promise<unknown> {
  const key = auth === "read" ? need("READ_API_KEY") : need("CONTROL_API_KEY");
  const hasBody = init?.body !== undefined;
  const url = `${need("BUSCA_BASE")}${hasBody ? path : withAccountParam(path, accountId)}`;
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: hasBody ? JSON.stringify({ ...init.body, account_id: accountId }) : undefined,
    cache: "no-store",
  });
  return jsonOrThrow(res, `Busca ${path}`);
}

/**
 * Leitura CRUA no Supabase REST com service key — SEM escopo de conta.
 * Uso restrito: lookups de infraestrutura (account_members, accounts) e
 * tabelas globais sem account_id (agent_registry). Dados de cliente usam
 * supabaseSelect, que exige accountId.
 */
export async function supabaseAdminSelect(table: string, query = ""): Promise<unknown> {
  const key = need("SUPABASE_SERVICE_KEY");
  const url = `${need("SUPABASE_URL")}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  return jsonOrThrow(res, `Supabase ${table}`);
}

/** Leitura no Supabase escopada por conta: toda query sai com account_id=eq.<id>. */
export async function supabaseSelect(
  table: string,
  accountId: string,
  query = "",
): Promise<unknown> {
  const scoped = `account_id=eq.${encodeURIComponent(accountId)}${query ? `&${query}` : ""}`;
  return supabaseAdminSelect(table, scoped);
}
