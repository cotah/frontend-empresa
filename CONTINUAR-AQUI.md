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

## ⏳ Próximos passos

1. **Preencher `.env.local`** (copiar de `.env.example`) e testar contra os upstreams reais
   (n8n, CFO Railway, Busca Railway, Supabase).
2. **Deploy Vercel:** importar repo + cadastrar env vars em Settings → Environment Variables.
3. **Bloco de Junção (futuro):** tracking real da esteira em `/producao` — tabela
   `orchestration_runs` + endpoints 🟡 do spec.

## Notas técnicas

- Componentes shadcn aqui usam **Base UI** (não Radix): composição é `render={<X/>}`,
  NÃO `asChild` (já corrigido em `/ideias` e Home).
- Páginas são client components usando `useApi`/`postJson` (`lib/hooks.ts`).
- Browser NUNCA chama n8n/CFO/Busca/Supabase direto — só `/api/*` (BFF).
- Textos da UI em pt-BR; labels técnicos minúsculos via `.label-mono`.
