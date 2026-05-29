export const fmtBRL = (n: number): string =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtNum = (n: number, d = 1): string =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

export const fmtPct = (n: number): string =>
  (Number(n) * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + "%";
