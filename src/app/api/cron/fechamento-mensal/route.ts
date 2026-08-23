import { NextRequest, NextResponse } from "next/server";
import { fecharMes } from "@/lib/fechamentoMensal";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();
  let mesIndex0 = agora.getUTCMonth() - 1;
  let ano = agora.getUTCFullYear();
  if (mesIndex0 < 0) {
    mesIndex0 = 11;
    ano -= 1;
  }

  try {
    const fechamento = await fecharMes(ano, mesIndex0);
    return NextResponse.json({ ok: true, fechamento: fechamento.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, motivo: e.message });
  }
}