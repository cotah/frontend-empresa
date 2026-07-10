/**
 * Sessão de dono único (Henrique): a senha vive em APP_PASSWORD (env).
 * O cookie guarda um hash derivado da senha — nunca a senha em si.
 * Usa Web Crypto (funciona tanto no Node quanto no Edge/middleware).
 */
export const SESSION_COOKIE = "capiva_session";

export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`capivarex::${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
