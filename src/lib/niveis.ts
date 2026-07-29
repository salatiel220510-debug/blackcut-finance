export type Nivel = "Aprendiz" | "Pleno" | "Sênior";

export function calcularNivel(faturamentoTotal: number): Nivel {
  if (faturamentoTotal >= 8000) return "Sênior";
  if (faturamentoTotal >= 2000) return "Pleno";
  return "Aprendiz";
}

export function corDoNivel(nivel: Nivel): string {
  if (nivel === "Sênior") return "#d4af37"; // dourado
  if (nivel === "Pleno") return "#9c7a1e"; // dourado escuro
  return "#8a8a8a"; // cinza
}