import { NextRequest, NextResponse } from "next/server";
import { enviarResumoDiario } from "@/lib/resumoDiario";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const resultado = await enviarResumoDiario();
  return NextResponse.json({ ok: true, ...resultado });
}