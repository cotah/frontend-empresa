import { NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Runs recentes da esteira (orchestration_runs, mais novos primeiro). */
export async function GET() {
  try {
    const data = await supabaseSelect(
      "orchestration_runs",
      "select=*&order=created_at.desc&limit=20",
    );
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
