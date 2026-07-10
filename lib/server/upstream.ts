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

function need(name: string): string {
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

/** POST num webhook do n8n (CEO, gates, pontes, dispatch). */
export async function n8nPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${need("N8N_BASE")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return jsonOrThrow(res, `n8n ${path}`);
}

/** Chamada ao CFO Railway (FastAPI) com X-API-Key. */
export async function cfoFetch(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<unknown> {
  const res = await fetch(`${need("CFO_BASE")}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": need("CFO_API_KEY"),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  return jsonOrThrow(res, `CFO ${path}`);
}

/** Chamada ao backend Busca Railway com X-API-Key (read ou control). */
export async function buscaFetch(
  path: string,
  auth: "read" | "control" = "read",
  init?: { method?: string; body?: unknown },
): Promise<unknown> {
  const key = auth === "read" ? need("READ_API_KEY") : need("CONTROL_API_KEY");
  const res = await fetch(`${need("BUSCA_BASE")}${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  return jsonOrThrow(res, `Busca ${path}`);
}

/** Leitura no Supabase REST com service key (RLS exige service_role). */
export async function supabaseSelect(table: string, query = ""): Promise<unknown> {
  const key = need("SUPABASE_SERVICE_KEY");
  const url = `${need("SUPABASE_URL")}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  return jsonOrThrow(res, `Supabase ${table}`);
}
