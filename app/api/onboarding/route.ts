import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdminSelect,
  supabaseSelect,
  supabaseInsert,
  supabasePatch,
  updateAccount,
  UpstreamError,
} from "@/lib/server/upstream";
import { requireAccount, invalidateMembership, markOnboarded } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

/** Cores padrão quando o cliente pula a tela de marca (defaults sensatos). */
const DEFAULT_COLORS = {
  primary_color: "#2563eb",
  bg_color: "#ffffff",
  text_color: "#111827",
};

/** brand_name → slug único por conta: minúsculas, sem acento, [a-z0-9-]. */
function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "produto";
}

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Estado atual da conta — prefill do assistente. */
export async function GET() {
  try {
    const { accountId } = await requireAccount();
    const rows = (await supabaseAdminSelect(
      "accounts",
      `select=name,country,city,website,onboarding_completed_at&id=eq.${encodeURIComponent(accountId)}&limit=1`,
    )) as Array<{
      name: string;
      country: string | null;
      city: string | null;
      website: string | null;
      onboarding_completed_at: string | null;
    }>;
    const account = rows[0];
    if (!account) throw new UpstreamError("Conta não encontrada", 404);
    return NextResponse.json({
      name: account.name,
      country: account.country,
      city: account.city,
      website: account.website,
      completed: !!account.onboarding_completed_at,
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Conclui o onboarding: grava empresa em accounts, produto/marca em
 * brand_context e carimba accounts.onboarding_completed_at.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, accountId } = await requireAccount();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const companyName = clean(body.companyName);
    const brandName = clean(body.brandName);
    const description = clean(body.description);
    const howItWorks = clean(body.howItWorks);
    if (!companyName || !brandName || !description || !howItWorks) {
      throw new UpstreamError(
        "Nome da empresa, nome do produto, descrição e como funciona são obrigatórios",
        400,
      );
    }

    const brandRow = {
      brand_name: brandName,
      description,
      how_it_works: howItWorks,
      price: clean(body.price),
      target_audience: clean(body.targetAudience),
      tone_of_voice: clean(body.toneOfVoice),
      tagline: clean(body.tagline),
      primary_color: clean(body.primaryColor) ?? DEFAULT_COLORS.primary_color,
      bg_color: clean(body.bgColor) ?? DEFAULT_COLORS.bg_color,
      text_color: clean(body.textColor) ?? DEFAULT_COLORS.text_color,
      website: clean(body.website),
    };

    // Idempotência: se um POST anterior já criou a marca (e falhou depois),
    // atualiza a linha existente em vez de duplicar com sufixo no slug.
    const existing = (await supabaseSelect(
      "brand_context",
      accountId,
      "select=product,brand_name",
    )) as Array<{ product: string; brand_name: string }>;
    const match = existing.find((b) => b.brand_name === brandName);

    if (match) {
      await supabasePatch(
        "brand_context",
        accountId,
        brandRow,
        `product=eq.${encodeURIComponent(match.product)}`,
      );
    } else {
      // Slug único por conta — colidiu, acrescenta sufixo numérico.
      const taken = new Set(existing.map((b) => b.product));
      const base = slugify(brandName);
      let product = base;
      for (let n = 2; taken.has(product); n++) product = `${base}-${n}`;
      await supabaseInsert("brand_context", accountId, { ...brandRow, product });
    }

    // Empresa + carimbo de conclusão por último: se algo acima falhar, o
    // assistente reaparece no próximo login e o cliente tenta de novo.
    await updateAccount(accountId, {
      name: companyName,
      country: clean(body.country),
      city: clean(body.city),
      website: clean(body.website),
      onboarding_completed_at: new Date().toISOString(),
    });

    markOnboarded(accountId);
    invalidateMembership(userId); // topbar mostra o nome novo da empresa já
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
