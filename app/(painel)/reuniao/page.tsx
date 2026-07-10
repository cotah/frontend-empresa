"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Markdown } from "@/components/smart-output";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/lib/hooks";
import type { CeoChatResponse } from "@/lib/types";

interface Msg {
  role: "user" | "helios";
  text: string;
}

const SUGGESTIONS = [
  "Como estamos de caixa?",
  "Me desafia numa ideia",
  "O que priorizar essa semana?",
];

export default function ReuniaoPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [product, setProduct] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<CeoChatResponse>("/api/ceo/chat", {
        message,
        ...(product.trim() ? { product: product.trim() } : {}),
      });
      setMessages((m) => [...m, { role: "helios", text: res.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col">
      <SectionHeader
        kicker="sala de reunião"
        title="Reunião com HELIOS"
        description="O CEO entra sabendo o caixa real, o trabalho recente e as lições aprendidas."
        right={
          <Input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Produto (opcional)"
            className="w-44 font-mono text-xs"
          />
        }
      />

      {/* Histórico */}
      <div className="reveal flex-1 overflow-y-auto rounded-md border border-border bg-card/60 p-4 space-y-4">
        {messages.length === 0 && !busy && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="text-sm text-muted-foreground">Comece a reunião:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-md bg-primary/15 border border-primary/30 px-4 py-2.5 text-sm"
                  : "max-w-[85%] rounded-md bg-muted/60 border border-border px-4 py-2.5 corner-frame"
              }
            >
              {m.role === "helios" && <div className="label-mono mb-1 text-primary">helios · ceo</div>}
              {m.role === "helios" ? <Markdown>{m.text}</Markdown> : <span>{m.text}</span>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="dot-pulse bg-primary" /> HELIOS está pensando… (5–15s)
          </div>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Fale com o CEO… (Enter envia, Shift+Enter quebra linha)"
          className="min-h-[52px] max-h-40 resize-none"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()} className="h-auto font-heading">
          <SendHorizonal className="size-4" />
        </Button>
      </form>
    </div>
  );
}
