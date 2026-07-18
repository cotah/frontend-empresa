import { NextRequest, NextResponse } from "next/server";
import { buscaFetch } from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

const FREQUENCIES = ["manual", "daily", "weekly", "monthly"] as const;

/** Configuração do Caçador de Oportunidades (backend Busca). */
export async function GET() {
  try {
    const { accountId } = await requireAccount();
    const data = await buscaFetch("/hunt/settings", accountId, "read");
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}

/** Salva a configuração do Caçador — enabled, frequency e topic. */
export async function PUT(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const body = (await req.json()) as {
      enabled?: boolean;
      frequency?: string;
      topic?: string;
    };
    if (
      typeof body.enabled !== "boolean" ||
      !FREQUENCIES.includes(body.frequency as (typeof FREQUENCIES)[number]) ||
      typeof body.topic !== "string"
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios: enabled (bool), frequency (manual|daily|weekly|monthly), topic (string)" },
        { status: 400 },
      );
    }
    const data = await buscaFetch("/hunt/settings", accountId, "control", {
      method: "PUT",
      body: { enabled: body.enabled, frequency: body.frequency, topic: body.topic },
    });
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
