import { calcular, mesesEntre } from "@/lib/calc";
import {
  INSUMOS_BAIXO_INIT,
  INSUMOS_ALTA_INIT,
  OPERACIONAL_INIT,
} from "@/lib/dados-iniciais";

// ─── Caso 1: validação original (barter=false, arrend=0) ──────────────────────
describe("calcular — caso original (planilha 1ª versão, barter=N, arrend=0)", () => {
  const R = calcular({
    produtividade: 60,
    precoDisp: 125,
    precoFuturo: 108,
    barter: false,
    arrendamento: 0,
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  });

  it("usa Baixo Custo (produtividade=60 não é > 60)", () => {
    expect(R.usaAlta).toBe(false);
  });

  it("investimentoTotal = 4563,8221", () => {
    expect(R.investimentoTotal).toBeCloseTo(4563.8221, 4);
  });

  it("receita = 7500,00", () => {
    expect(R.receita).toBeCloseTo(7500, 4);
  });

  it("custoBarter = 0 (barter=false)", () => {
    expect(R.custoBarter).toBe(0);
  });

  it("custoArrend = 0 (arrend=0)", () => {
    expect(R.custoArrend).toBe(0);
  });

  it("lucroOperacional = 2936,1779", () => {
    expect(R.lucroOperacional).toBeCloseTo(2936.1779, 4);
  });

  it("margem ≈ 0,3915 (39,15%)", () => {
    expect(R.margem).toBeCloseTo(0.3915, 4);
  });

  it("pontoEquilibrio ≈ 36,5106 sc/ha", () => {
    expect(R.pontoEquilibrio).toBeCloseTo(36.5106, 4);
  });

  it("custoPorSaca ≈ 76,0637 R$/sc", () => {
    expect(R.custoPorSaca).toBeCloseTo(76.0637, 4);
  });
});

// ─── Caso 2: validação planilha corrigida (barter=S, arrend=15) ───────────────
describe("calcular — caso corrigido (planilha revisada, barter=S, arrend=15)", () => {
  const R = calcular({
    produtividade: 60,
    precoDisp: 125,
    precoFuturo: 108,
    barter: true,
    arrendamento: 15,
    taxaMensal: 0.016,
    dataHoje: "2026-05-29",
    dataTravamento: "2027-04-30",
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  });

  it("usa Baixo Custo (produtividade=60 não é > 60)", () => {
    expect(R.usaAlta).toBe(false);
  });

  it("meses ≈ 11,2 (336 dias / 30)", () => {
    expect(R.meses).toBeCloseTo(11.2, 1);
  });

  it("custoBarter ≈ 887,96 (juros compostos sobre investimentoTotal)", () => {
    expect(R.custoBarter).toBeCloseTo(887.96, 2);
  });

  it("custoArrend = 1875,00 (15 sc × precoDisp R$125)", () => {
    expect(R.custoArrend).toBeCloseTo(1875.0, 2);
  });

  it("custoTotal ≈ 7326,78", () => {
    expect(R.custoTotal).toBeCloseTo(7326.78, 2);
  });

  it("receita = 6480,00 (barter → precoFuturo R$108)", () => {
    expect(R.receita).toBeCloseTo(6480, 2);
  });

  it("lucroOperacional ≈ −846,78", () => {
    expect(R.lucroOperacional).toBeCloseTo(-846.78, 2);
  });

  it("margem ≈ −0,1307 (−13,07%)", () => {
    expect(R.margem).toBeCloseTo(-0.1307, 4);
  });
});

// ─── Caso 3: interpolação linear (62 sc/ha — valor real de G3 na planilha) ────
describe("calcular — interpolação linear de insumos (62 sc/ha)", () => {
  // Replica E14 de PRODUCAO SOJA:
  //   deltaTotal = (subAlta+opAlta) − (subBaixo+opBaixo)
  //              = (4417,2365+1400) − (3263,8221+1300) = 1253,4144
  //   O33 = (62−60)/30 × 1253,4144 = 83,5610
  //   insumos = 3263,8221 + 83,5610 = 3347,3831
  //   opVal = 1400 (salto binário para alta quando P > 60)
  //   investimentoTotal = 4747,3831
  const R = calcular({
    produtividade: 62,
    precoDisp: 125,
    precoFuturo: 108,
    barter: false,
    arrendamento: 15,
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  });

  it("usa Alta (produtividade=62 > 60)", () => {
    expect(R.usaAlta).toBe(true);
  });

  it("insumos interpolados ≈ 3347,3831", () => {
    expect(R.insumos).toBeCloseTo(3347.3831, 2);
  });

  it("opVal = 1400 (salto para alta config)", () => {
    expect(R.opVal).toBeCloseTo(1400, 2);
  });

  it("investimentoTotal ≈ 4747,3831", () => {
    expect(R.investimentoTotal).toBeCloseTo(4747.3831, 2);
  });

  it("custoArrend = 1875 (15 sc × R$125 precoDisp)", () => {
    expect(R.custoArrend).toBeCloseTo(1875, 2);
  });

  it("receita = 7750 (62 sc × R$125)", () => {
    expect(R.receita).toBeCloseTo(7750, 2);
  });
});

// ─── Caso 4: extremo superior (90 sc/ha) e clamp acima de 90 ──────────────────
describe("calcular — interpolação no extremo (90 sc/ha) e clamp acima de 90", () => {
  const base = {
    precoDisp: 125,
    precoFuturo: 108,
    barter: false,
    arrendamento: 0,
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  };
  const R90 = calcular({ ...base, produtividade: 90 });
  const R100 = calcular({ ...base, produtividade: 100 });

  // Aos 90: deltaP = 30/30 = 1 → insumos = subBaixo + deltaTotal
  //   = 3263,8221 + 1253,4144 = 4517,2365 (overshoot proposital da planilha)
  it("insumos aos 90 ≈ 4517,2365 (overshoot vs subAlta 4417)", () => {
    expect(R90.insumos).toBeCloseTo(4517.2365, 2);
  });

  it("investimentoTotal aos 90 ≈ 5917,2365", () => {
    expect(R90.investimentoTotal).toBeCloseTo(5917.2365, 2);
  });

  it("acima de 90 (clamp): deltaP é limitado a 30, insumos idênticos aos 90", () => {
    expect(R100.insumos).toBeCloseTo(R90.insumos, 6);
    expect(R100.opVal).toBe(R90.opVal); // operacional alta em ambos
  });
});

// ─── Auxiliar mesesEntre ──────────────────────────────────────────────────────
describe("mesesEntre", () => {
  it("2026-05-29 → 2027-04-30 ≈ 11,2 meses", () => {
    expect(mesesEntre("2026-05-29", "2027-04-30")).toBeCloseTo(11.2, 1);
  });

  it("datas inválidas retornam 0", () => {
    expect(mesesEntre("", "2027-04-30")).toBe(0);
    expect(mesesEntre("2026-05-29", "invalid")).toBe(0);
  });
});

// ─── Trava de custos (Alta Produtividade) ──────────────────────────────────────
describe("calcular — trava de custos de insumos em Alta Produtividade", () => {
  const base = {
    precoDisp: 125,
    precoFuturo: 108,
    barter: false,
    arrendamento: 0,
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  };

  it("sem trava, insumos crescem ao aumentar sc/ha dentro de 60–90", () => {
    const R62 = calcular({ ...base, produtividade: 62 });
    const R70 = calcular({ ...base, produtividade: 70 });
    expect(R70.insumos).toBeGreaterThan(R62.insumos);
  });

  it("com trava, aumentar sc/ha não aumenta mais os insumos (posição congelada)", () => {
    const R62 = calcular({ ...base, produtividade: 62 });
    const R70Travado = calcular({
      ...base,
      produtividade: 70,
      produtividadeTravada: 62,
    });
    expect(R70Travado.insumos).toBeCloseTo(R62.insumos, 6);
    expect(R70Travado.custosTravados).toBe(true);
  });

  it("mesmo travado, editar preço/qtde de um insumo ainda reflete no cálculo", () => {
    const insumosAltaEditado = INSUMOS_ALTA_INIT.map((item, idx) =>
      idx === 0 ? { ...item, valor: item.valor * 2 } : item
    );
    const R62Original = calcular({ ...base, produtividade: 62, produtividadeTravada: 62 });
    const R70TravadoEditado = calcular({
      ...base,
      produtividade: 70,
      insumosAlta: insumosAltaEditado,
      produtividadeTravada: 62,
    });
    // mesma posição de interpolação (62), mas insumo mais caro → total maior
    expect(R70TravadoEditado.insumos).toBeGreaterThan(R62Original.insumos);
  });

  it("trava não tem efeito fora da Alta Produtividade (produtividade <= 60)", () => {
    const R = calcular({ ...base, produtividade: 60, produtividadeTravada: 75 });
    expect(R.custosTravados).toBe(false);
    expect(R.insumos).toBeCloseTo(3263.8221, 4);
  });
});

// ─── Barter ativo usa preço futuro na receita ─────────────────────────────────
describe("calcular — barter usa preço futuro na receita, arrend usa preço disponível", () => {
  const R = calcular({
    produtividade: 60,
    precoDisp: 125,
    precoFuturo: 108,
    barter: true,
    arrendamento: 10,
    taxaMensal: 0,      // sem juros para isolar o arrendamento
    dataHoje: "2026-01-01",
    dataTravamento: "2026-01-01",
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  });

  it("precoSaca = precoFuturo (108) quando barter=true", () => {
    expect(R.precoSaca).toBe(108);
  });

  it("custoArrend = 10 × 125 (precoDisp), não usa precoFuturo", () => {
    expect(R.custoArrend).toBeCloseTo(1250, 2);
  });

  it("custoBarter = 0 quando taxa=0 ou datas iguais", () => {
    expect(R.custoBarter).toBeCloseTo(0, 6);
  });
});
