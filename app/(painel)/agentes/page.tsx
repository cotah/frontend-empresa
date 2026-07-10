"use client";

import { useMemo, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { AsyncPanel } from "@/components/async-panel";
import { SmartOutput } from "@/components/smart-output";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi, postJson } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { AgentInfo } from "@/lib/types";

export default function AgentesPage() {
  const agents = useApi<AgentInfo[]>("/api/agents");
  const [selected, setSelected] = useState<AgentInfo | null>(null);
  const [product, setProduct] = useState("");
  const [instruction, setInstruction] = useState("");
  const [freeText, setFreeText] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, AgentInfo[]>();
    for (const a of agents.data ?? []) {
      const cat = a.category || "outros";
      map.set(cat, [...(map.get(cat) ?? []), a]);
    }
    return [...map.entries()];
  }, [agents.data]);

  async function dispatch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await postJson("/api/dispatch", body));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeader
        kicker="roster"
        title="Agentes"
        description="Todos os funcionários da empresa — e o balcão pra despachar tarefas."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Roster */}
        <div className="reveal space-y-6">
          <AsyncPanel
            loading={agents.loading}
            error={agents.error}
            empty={(agents.data?.length ?? 0) === 0}
            emptyMessage="Registry vazio."
            onRetry={agents.reload}
          >
            {grouped.map(([category, list]) => (
              <div key={category}>
                <div className="label-mono mb-2">{category}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {list.map((a) => (
                    <button
                      key={a.agent_key}
                      onClick={() => setSelected(a)}
                      className={cn(
                        "rounded-md border p-3 text-left transition-colors",
                        selected?.agent_key === a.agent_key
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            a.active ? "bg-success" : "bg-muted-foreground/40",
                          )}
                        />
                        <span className="font-heading font-semibold text-sm">{a.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{a.agent_key}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </AsyncPanel>
        </div>

        {/* Balcão de despacho */}
        <div className="reveal lg:sticky lg:top-20 h-fit" style={{ animationDelay: "120ms" }}>
          <div className="corner-frame rounded-md border border-border bg-card p-5">
            <div className="label-mono mb-3">despachar tarefa</div>
            <Tabs defaultValue="direto">
              <TabsList className="w-full">
                <TabsTrigger value="direto" className="flex-1 font-heading">Direto</TabsTrigger>
                <TabsTrigger value="inteligente" className="flex-1 font-heading">Inteligente</TabsTrigger>
              </TabsList>

              <TabsContent value="direto" className="mt-3 space-y-3">
                <div className="rounded-md bg-muted/40 p-2.5 text-xs">
                  {selected ? (
                    <>
                      <span className="font-heading font-semibold text-primary">{selected.name}</span>
                      {selected.primary_inputs && (
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          inputs: {selected.primary_inputs}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">← selecione um agente no roster</span>
                  )}
                </div>
                <Input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="Produto (slug)"
                  className="font-mono text-xs"
                />
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Instrução pro agente…"
                  className="min-h-24"
                />
                <Button
                  className="w-full font-heading"
                  disabled={busy || !selected}
                  onClick={() =>
                    dispatch({
                      agent: selected!.agent_key,
                      ...(product.trim() ? { product: product.trim() } : {}),
                      ...(instruction.trim() ? { message: instruction.trim() } : {}),
                    })
                  }
                >
                  <SendHorizonal className="size-4 mr-1" />
                  {busy ? "Despachando…" : "Despachar"}
                </Button>
              </TabsContent>

              <TabsContent value="inteligente" className="mt-3 space-y-3">
                <Textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder='Pedido em texto livre — o HELIOS escolhe o agente. Ex.: "escreve 3 posts pro SmartTap"'
                  className="min-h-32"
                />
                <Button
                  className="w-full font-heading"
                  disabled={busy || !freeText.trim()}
                  onClick={() => dispatch({ message: freeText.trim() })}
                >
                  <SendHorizonal className="size-4 mr-1" />
                  {busy ? "Roteando…" : "Mandar pro HELIOS rotear"}
                </Button>
              </TabsContent>
            </Tabs>

            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            {result != null && (
              <div className="mt-4 max-h-96 overflow-y-auto border-t border-border pt-4">
                <SmartOutput data={result} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
