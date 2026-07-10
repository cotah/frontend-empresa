import { NextResponse } from "next/server";
import { UpstreamError } from "./upstream";

/** Converte qualquer erro numa resposta JSON clara (sem vazar stack/segredo). */
export function fail(e: unknown): NextResponse {
  const message = e instanceof Error ? e.message : "Erro inesperado";
  const status = e instanceof UpstreamError ? e.status : 500;
  console.error("[api]", message);
  return NextResponse.json({ error: message }, { status });
}
