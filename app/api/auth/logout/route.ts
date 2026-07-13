import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server/supabase";
import { fail } from "@/lib/server/route-helpers";

export async function POST() {
  try {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
