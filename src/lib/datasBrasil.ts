const OFFSET_BRASIL_HORAS = 3;

export function limitesDoDiaEspecifico(dataString: string) {
  const [ano, mes, dia] = dataString.split("-").map(Number);
  const inicioBrasil = Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0);
  const fimBrasil = Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999);
  return {
    inicio: new Date(inicioBrasil + OFFSET_BRASIL_HORAS * 60 * 60 * 1000),
    fim: new Date(fimBrasil + OFFSET_BRASIL_HORAS * 60 * 60 * 1000),
  };
}

export function hojeBrasilString() {
  const brasil = new Date(Date.now() - OFFSET_BRASIL_HORAS * 60 * 60 * 1000);
  const ano = brasil.getUTCFullYear();
  const mes = String(brasil.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(brasil.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
export function diaBrasilDeData(data: Date): string {
  const OFFSET_BRASIL_HORAS = 3;
  const brasil = new Date(data.getTime() - OFFSET_BRASIL_HORAS * 60 * 60 * 1000);
  const ano = brasil.getUTCFullYear();
  const mes = String(brasil.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(brasil.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}