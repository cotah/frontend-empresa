import { redirect } from "next/navigation";
import { requireAccount, isOnboarded } from "@/lib/server/supabase";
import { supabaseAdminSelect } from "@/lib/server/upstream";
import { OnboardingWizard } from "./wizard";

/** Assistente de primeira entrada — some pra sempre depois de concluído. */
export default async function OnboardingPage() {
  const ctx = await requireAccount().catch(() => null);
  if (!ctx) redirect("/login");
  if (await isOnboarded(ctx.accountId)) redirect("/");

  // Prefill: o gatilho de cadastro já criou a conta com um nome inicial.
  const rows = (await supabaseAdminSelect(
    "accounts",
    `select=name,country,city,website&id=eq.${encodeURIComponent(ctx.accountId)}&limit=1`,
  )) as Array<{
    name: string;
    country: string | null;
    city: string | null;
    website: string | null;
  }>;
  const account = rows[0];

  return (
    <OnboardingWizard
      initial={{
        companyName: account?.name ?? "",
        country: account?.country ?? "",
        city: account?.city ?? "",
        website: account?.website ?? "",
      }}
    />
  );
}
