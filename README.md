# CAPIVAREX — Command Deck

Cockpit da CAPIVAREX: um painel único onde o Henrique conversa com o CEO (HELIOS),
aprova ideias e gastos, acompanha o financeiro (ATLAS), dispara lançamentos e vê a
atividade de todos os agentes da empresa.

## Arquitetura

```
Browser ──▶ Next.js (este repo) ──▶ n8n / CFO Railway / Busca Railway / Supabase
            │
            ├─ app/(painel)/*   → telas (client components)
            ├─ app/api/*        → BFF: rotas que fazem proxy dos upstreams
            ├─ lib/server/*     → camada única de upstream (chaves só no servidor)
            └─ proxy.ts         → auth por cookie (senha única, APP_PASSWORD)
```

Regra de ouro: **o browser nunca fala com n8n/CFO/Busca/Supabase direto** — só com
`/api/*`. Todas as chaves vivem em env vars do servidor.

## Telas

| Rota | O que faz |
| --- | --- |
| `/login` | Senha única (`APP_PASSWORD`) → cookie httponly |
| `/` | Home: visão geral com stats e pendências |
| `/reuniao` | Chat com o CEO (HELIOS) |
| `/aprovacoes` | Aprovar/rejeitar ideias e gastos pendentes |
| `/financeiro` | Resumo do CFO (ATLAS), gráfico, perguntas e relatório semanal |
| `/ideias` | Estoque de ideias internas + oportunidades da Busca + marcas |
| `/producao` | Disparar lançamento + acompanhar a esteira ao vivo (fases, portões, avançar) |
| `/revisao` | Galeria das peças da Criação — aprovar/rejeitar uma a uma antes de ir pro ar |
| `/agentes` | Roster de agentes + despacho de tarefas (direto ou via HELIOS) |
| `/atividade` | Registro de trabalho (work_log) + lições aprendidas |
| `/apis` | Anotação manual de saldos por provedor (localStorage) |

## Como rodar

```bash
npm install
cp .env.example .env.local   # e preencha as chaves
npm run dev                  # http://localhost:3000
```

Sem `APP_PASSWORD` configurada, tudo fica bloqueado (por design).

### Env vars (todas server-side)

| Var | Para quê |
| --- | --- |
| `APP_PASSWORD` | Senha do cockpit (dono único) |
| `N8N_BASE` | Base dos webhooks n8n (CEO, gates, dispatch) |
| `CFO_BASE` / `CFO_API_KEY` | CFO Railway (FastAPI) |
| `BUSCA_BASE` / `READ_API_KEY` / `CONTROL_API_KEY` | Busca Railway (market-intelligence) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Supabase (Cérebro) — service key só no servidor |

## Deploy (Vercel)

1. Importar o repo na Vercel (framework: Next.js, zero config).
2. Em **Settings → Environment Variables**, cadastrar todas as vars da tabela acima.
3. Deploy. O middleware protege todas as rotas — sem senha, nada abre.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · lucide-react ·
recharts · react-markdown. Tema dark "Command Deck" em `app/globals.css`.
