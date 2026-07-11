# CONTINUAR AQUI — estado do capiva-front (11/07/2026)

Cockpit da CAPIVAREX (spec: "CAPIVAREX — Especificação do Frontend").

## ✅ MVP COMPLETO — todas as 10 telas prontas, build limpo, smoke test ok

- **Fundação:** Next.js 16 + TS + Tailwind v4 + shadcn/ui (Base UI) + lucide + recharts + react-markdown
- **Tema:** dark cockpit ("Command Deck") em `app/globals.css`
- **Auth:** senha única `APP_PASSWORD` → cookie httponly (`lib/auth.ts`, `proxy.ts` —
  migrado de `middleware.ts`, convenção nova do Next 16). Sem APP_PASSWORD = tudo bloqueado.
- **BFF completo (19 rotas em `app/api/*`)** + `lib/server/upstream.ts` + `route-helpers.ts`
- **Telas (todas):** `/login`, `/` (Home), `/reuniao`, `/aprovacoes`, `/financeiro`,
  `/ideias`, `/producao` (form lançamento + stepper estático 9 fases), `/agentes`,
  `/atividade` (work_log + learnings), `/apis` (saldos manuais em localStorage)
- **README.md** completo (arquitetura, telas, env vars, deploy Vercel)
- **Validado:** `npm run build` passa sem erros nem warnings; smoke test com dev server
  (login → 307/200, telas novas 200, erro legível sem chaves de upstream)

## ✅ Feito depois do MVP (11/07/2026)

- **Esteira ao vivo em `/producao`** (Bloco de Junção, spec §9): runs, stepper real,
  portões com aprovar/rejeitar, avançar (maxDuration 300).
- **`/revisao` — Revisão de Criação** (spec §10): galeria de `creation_assets` por
  `asset_type`, preparar idempotente, decidir peça a peça, filtro + contador.
  BFF: `/api/review/{preparar,decidir,assets}`. Só `status=approved` vai pro ar.
- **Deploy Vercel em produção:** https://capiva-front.vercel.app (env vars cadastradas,
  deploy via `npx vercel --prod`).

## ⏳ Próximos passos

1. Rodar um lançamento real de ponta a ponta (Criação → `/revisao` → Publicação/Portão 5).
2. Polir a Publicação quando o PROVISION estiver consumindo os assets aprovados.

## Notas técnicas

- Componentes shadcn aqui usam **Base UI** (não Radix): composição é `render={<X/>}`,
  NÃO `asChild` (já corrigido em `/ideias` e Home).
- Páginas são client components usando `useApi`/`postJson` (`lib/hooks.ts`).
- Browser NUNCA chama n8n/CFO/Busca/Supabase direto — só `/api/*` (BFF).
- Textos da UI em pt-BR; labels técnicos minúsculos via `.label-mono`.
