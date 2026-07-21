import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { requireAccount, isOnboarded } from "@/lib/server/supabase";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  // Conta nova (onboarding_completed_at nulo) vai pro assistente antes do painel.
  // Depois de concluído o status fica em cache — custo zero nos acessos seguintes.
  const ctx = await requireAccount().catch(() => null);
  if (!ctx) redirect("/login");
  if (!(await isOnboarded(ctx.accountId))) redirect("/onboarding");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
