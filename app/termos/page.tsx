import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos & Condições — Capivarex",
};

/** Página estática de Termos & Condições, linkada no checkbox do cadastro. */
export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="font-heading text-2xl font-bold tracking-wide">
        CAPIVA<span className="text-primary">REX</span>
      </div>
      <div className="label-mono mt-1 mb-8">termos &amp; condições</div>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
            1. Aceitação
          </h2>
          <p>
            Ao criar uma conta na Capivarex você concorda com estes Termos &amp; Condições.
            Se não concordar com algum ponto, não utilize a plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
            2. O serviço
          </h2>
          <p>
            A Capivarex é um painel de orquestração de agentes de marketing e operação.
            O serviço é fornecido &quot;como está&quot; e pode evoluir, mudar ou ser
            descontinuado a qualquer momento, com aviso prévio razoável.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
            3. Sua conta
          </h2>
          <p>
            Você é responsável por manter a confidencialidade da sua senha e por toda
            atividade realizada na sua conta. Informe dados verdadeiros no cadastro
            (nome, telefone e e-mail) e mantenha-os atualizados.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
            4. Dados e privacidade
          </h2>
          <p>
            Coletamos apenas os dados necessários para operar a plataforma: nome, telefone,
            e-mail e registros de uso. Não vendemos seus dados a terceiros. Você pode
            solicitar a exclusão da sua conta e dos seus dados a qualquer momento.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
            5. Comunicações
          </h2>
          <p>
            E-mails transacionais (confirmação de conta, recuperação de senha, avisos de
            operação) são enviados sempre. E-mails de novidades e marketing só são enviados
            se você marcar a opção correspondente no cadastro — e você pode cancelar quando
            quiser.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-base font-semibold text-foreground">
            6. Contato
          </h2>
          <p>
            Dúvidas sobre estes termos? Fale com a gente pelo e-mail de suporte indicado
            no painel.
          </p>
        </section>
      </div>

      <div className="mt-10 font-mono text-[11px]">
        <Link href="/cadastro" className="text-primary hover:underline">
          Voltar ao cadastro
        </Link>
      </div>
    </div>
  );
}
