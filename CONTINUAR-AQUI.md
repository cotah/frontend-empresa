# CONTINUAR AQUI — estado do capiva-front (10/07/2026)

Cockpit da CAPIVAREX (spec: "CAPIVAREX — Especificação do Frontend"). Sessão anterior
parou aqui por limite de contexto. **Nada foi buildado/testado ainda.**

## ✅ Pronto (no disco, commitado)

- **Fundação:** Next.js 15 + TS + Tailwind v4 + shadcn/ui + lucide + recharts + react-markdown
- **Tema:** dark cockpit ("Command Deck") em `app/globals.css` — fontes Oxanium (display) +
  IBM Plex Sans/Mono, âmbar `#e8a33d`, grid de fundo, classes `.corner-frame`, `.label-mono`,
  `.reveal`, `.dot-pulse`, estilos `.md-body` p/ markdown
- **Auth:** senha única `APP_PASSWORD` → cookie httponly (`lib/auth.ts`, `middleware.ts`,
  `app/api/auth/login|logout`). Sem APP_PASSWORD = tudo bloqueado.
- **BFF completo (19 rotas em `app/api/*`):** ceo/chat, ceo/idea, orchestrator/launch,
  ideas (+decide), spending (+decide), approvals/count, cfo/reports|ask|weekly,
  busca/opportunities, brands, agents, worklog, learnings, dispatch.
  Camada única de upstream: `lib/server/upstream.ts` (n8nPost, cfoFetch, buscaFetch,
  supabaseSelect) + `lib/server/route-helpers.ts` (fail).
- **Lib client:** `lib/hooks.ts` (useApi c/ polling + postJson, redireciona 401→/login),
  `lib/format.ts`, `lib/types.ts` (shapes da seção 5 do spec)
- **Shell:** `components/shell/sidebar.tsx` (nav 9 itens + badge pendências) e
  `topbar.tsx` (caixa real, pendências, relógio, logout); layout em `app/(painel)/layout.tsx`
- **Componentes:** section-header, status-badge, smart-output (Markdown + SmartOutput),
  stat-card, async-panel
- **Telas prontas:** `/login`, `/` (Home), `/reuniao` (chat HELIOS), `/aprovacoes`
  (tabs Ideias/Gastos c/ aprovar-rejeitar), `/financeiro` (resumo + chart + ask ATLAS +
  weekly), `/ideias` (internas + Busca + marcas + dialog Modo Ideia), `/agentes`
  (roster agrupado + despacho direto/inteligente)

## ⏳ Falta fazer (em ordem)

1. **`app/(painel)/atividade/page.tsx`** — work_log (tabela, filtro client-side por
   agente/produto) + agent_learnings (cards c/ badge kind). Endpoints prontos:
   `/api/worklog?limit=`, `/api/learnings`. Usar SectionHeader/AsyncPanel/StatusBadge.
2. **`app/(painel)/producao/page.tsx`** — form "disparar lançamento" (product_name →
   POST `/api/orchestrator/launch` → SmartOutput) + stepper ESTÁTICO das 9 fases
   (Inteligência → Ideia🚪 → Produto🚪 → Marca🚪 → Estratégia🚪 → Criação →
   Publicação🚪 → Operação → Medição) + nota âmbar: tracking real chega com o
   Bloco de Junção (tabela orchestration_runs, endpoints 🟡 do spec).
3. **`app/(painel)/apis/page.tsx`** — MVP manual: cards por provedor (Anthropic, OpenAI,
   Perplexity, Serper, Higgsfield, Apify, Meta) com saldo/data recarga/link dashboard,
   persistido em localStorage (client-only). Nota de honestidade: provedores não expõem
   saldo via API.
4. **README.md** — visão geral + como rodar (`npm run dev`) + deploy Vercel + env vars.
5. **Validar:** `npm run build` (corrigir erros de type/lint) e testar `npm run dev`
   com .env.local preenchido.
6. **Commit final** e (opcional) deploy Vercel.

## Convenções usadas
- Páginas são client components (`"use client"`) usando `useApi`/`postJson`.
- Browser NUNCA chama n8n/CFO/Busca/Supabase direto — só `/api/*` (BFF).
- Textos da UI em pt-BR; labels técnicos minúsculos via `.label-mono`.
