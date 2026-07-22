import { NextRequest, NextResponse } from "next/server";
import {
  supabaseSelect,
  supabaseInsert,
  supabasePatch,
  UpstreamError,
} from "@/lib/server/upstream";
import { requireAccount } from "@/lib/server/supabase";
import { slugify } from "@/lib/server/slug";
import { fail } from "@/lib/server/route-helpers";

/** Mesmos defaults do onboarding quando as cores não vêm. */
const DEFAULT_COLORS = {
  primary_color: "#2563eb",
  bg_color: "#ffffff",
  text_color: "#111827",
};

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Contrato do produto (o mesmo do onboarding): nome, descrição e como
 * funciona sempre juntos — produto pela metade não serve pros agentes.
 */
function parseBrandFields(body: Record<string, unknown>) {
  const brandName = clean(body.brandName);
  const description = clean(body.description);
  const howItWorks = clean(body.howItWorks);
  if (!brandName || !description || !howItWorks) {
    throw new UpstreamError(
      "Nome do produto, descrição e como funciona são obrigatórios",
      400,
    );
  }
  return {
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
  };
}

/** UNIQUE (account_id, product) do banco → mensagem amigável em vez de 502. */
function friendlySlugError(e: unknown): never {
  if (e instanceof UpstreamError && /duplicate key|23505/i.test(e.message)) {
    throw new UpstreamError("Já existe um produto com esse nome nesta conta", 409);
  }
  throw e;
}

/** Produtos/marcas ativos (brand_context). */
export async function GET() {
  try {
    const { accountId } = await requireAccount();
    const data = await supabaseSelect(
      "brand_context",
      accountId,
      "select=*&order=created_at.desc&limit=100",
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}

/** Cria um produto novo — slug único por conta com sufixo numérico em colisão. */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const brandRow = parseBrandFields(body);

    const existing = (await supabaseSelect(
      "brand_context",
      accountId,
      "select=product",
    )) as Array<{ product: string }>;
    const taken = new Set(existing.map((b) => b.product));
    const base = slugify(brandRow.brand_name);
    let product = base;
    for (let n = 2; taken.has(product); n++) product = `${base}-${n}`;

    const created = await supabaseInsert("brand_context", accountId, {
      ...brandRow,
      product,
    }).catch(friendlySlugError);
    return NextResponse.json({ ok: true, product, created });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Edita um produto existente, identificado pelo slug no corpo ({ product }).
 * O slug nunca muda — é a chave estável referenciada pelo worklog e agentes.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { accountId } = await requireAccount();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const product = clean(body.product);
    if (!product) throw new UpstreamError("Produto não informado", 400);
    const brandRow = parseBrandFields(body);

    const updated = (await supabasePatch(
      "brand_context",
      accountId,
      brandRow,
      `product=eq.${encodeURIComponent(product)}`,
    )) as unknown[];
    // PostgREST retorna as linhas afetadas — vazio significa slug inexistente na conta.
    if (!Array.isArray(updated) || updated.length === 0) {
      throw new UpstreamError("Produto não encontrado", 404);
    }
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    return fail(e);
  }
}
