import { NextResponse } from "next/server";
import { cfoFetch } from "@/lib/server/upstream";
import { fail } from "@/lib/server/route-helpers";

/** Relatório semanal do ATLAS. */
export async function GET() {
  try {
    const data = await cfoFetch("/atlas/report/weekly");
    return NextResponse.json(data);
  } catch (e) {
    return fail(e);
  }
}
