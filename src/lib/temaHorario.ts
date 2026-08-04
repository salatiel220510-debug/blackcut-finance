export function obterTemaPorHorario(): "day" | "night" {
  const hora = new Date().getHours();
  return hora >= 6 && hora < 18 ? "day" : "night";
}