"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Busca um endpoint /api/* com estados de loading/erro e polling opcional.
 * Todo dado do cockpit passa por aqui — o browser só fala com o próprio Next.
 */
export function useApi<T>(url: string | null, pollMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
      setData(json as T);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de rede");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    reload();
    if (pollMs) {
      const id = setInterval(reload, pollMs);
      return () => clearInterval(id);
    }
  }, [reload, pollMs]);

  return { data, error, loading, reload };
}

/** POST JSON num endpoint /api/* com erro legível. */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Sessão expirada");
  }
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `Erro ${res.status}`);
  return json as T;
}
