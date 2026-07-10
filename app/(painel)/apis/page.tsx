"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Input } from "@/components/ui/input";

/**
 * MVP manual: os provedores não expõem saldo via API, então os valores
 * são anotados à mão e persistidos só neste navegador (localStorage).
 */
const PROVIDERS = [
  { key: "anthropic", name: "Anthropic", dashboard: "https://console.anthropic.com/settings/billing" },
  { key: "openai", name: "OpenAI", dashboard: "https://platform.openai.com/usage" },
  { key: "perplexity", name: "Perplexity", dashboard: "https://www.perplexity.ai/settings/api" },
  { key: "serper", name: "Serper", dashboard: "https://serper.dev/dashboard" },
  { key: "higgsfield", name: "Higgsfield", dashboard: "https://higgsfield.ai/" },
  { key: "apify", name: "Apify", dashboard: "https://console.apify.com/billing" },
  { key: "meta", name: "Meta (Ads)", dashboard: "https://business.facebook.com/billing_hub" },
];

const STORAGE_KEY = "capivarex.api-balances.v1";

interface ProviderNote {
  balance: string;
  rechargedAt: string;
}

type Notes = Record<string, ProviderNote>;

export default function ApisPage() {
  const [notes, setNotes] = useState<Notes>({});
  const [loaded, setLoaded] = useState(false);

  // Carrega do localStorage só no browser (evita mismatch de hidratação)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw) as Notes);
    } catch {
      // JSON corrompido — começa do zero
    }
    setLoaded(true);
  }, []);

  function update(key: string, field: keyof ProviderNote, value: string) {
    setNotes((prev) => {
      const current = prev[key] ?? { balance: "", rechargedAt: "" };
      const next = { ...prev, [key]: { ...current, [field]: value } };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage cheio/bloqueado — segue só em memória
      }
      return next;
    });
  }

  return (
    <div>
      <SectionHeader
        kicker="créditos"
        title="APIs / Saldos"
        description="Controle manual dos créditos de cada provedor usado pelos agentes."
      />

      {/* Nota de honestidade */}
      <div className="reveal mb-6 flex items-start gap-3 rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
        <Info className="size-4 shrink-0 mt-0.5 text-primary" />
        <p className="text-muted-foreground">
          <span className="font-semibold text-primary">Anotação manual.</span> Esses provedores
          não expõem saldo via API, então os valores aqui são preenchidos à mão e ficam salvos
          só neste navegador. Use o link de cada card pra conferir o valor real no dashboard oficial.
        </p>
      </div>

      <div className="reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: "120ms" }}>
        {PROVIDERS.map((p) => {
          const note = notes[p.key];
          return (
            <div key={p.key} className="corner-frame rounded-md border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-heading font-semibold">{p.name}</span>
                <a
                  href={p.dashboard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
                >
                  dashboard <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="label-mono mb-1">saldo / créditos</div>
                  <Input
                    value={note?.balance ?? ""}
                    onChange={(e) => update(p.key, "balance", e.target.value)}
                    placeholder="ex.: US$ 42,00 ou 1.500 créditos"
                    disabled={!loaded}
                    className="font-mono text-xs"
                  />
                </div>
                <div>
                  <div className="label-mono mb-1">última recarga</div>
                  <Input
                    type="date"
                    value={note?.rechargedAt ?? ""}
                    onChange={(e) => update(p.key, "rechargedAt", e.target.value)}
                    disabled={!loaded}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
