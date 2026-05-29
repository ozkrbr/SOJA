import { calcular } from "@/lib/calc";
import {
  INSUMOS_BAIXO_INIT,
  INSUMOS_ALTA_INIT,
  OPERACIONAL_INIT,
} from "@/lib/dados-iniciais";

describe("calcular — caso de validação da planilha CUSTO_SOJA_2026", () => {
  const resultado = calcular({
    produtividade: 60,
    precoDisp: 125,
    precoFuturo: 108,
    barter: false,
    arrendamento: 0,
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  });

  it("usa configuração Baixo Custo (produtividade=60 não é > 60)", () => {
    expect(resultado.usaAlta).toBe(false);
  });

  it("investimento total = 4563,8221", () => {
    expect(resultado.investimentoTotal).toBeCloseTo(4563.8221, 4);
  });

  it("receita bruta = 7500,00", () => {
    expect(resultado.receita).toBeCloseTo(7500, 4);
  });

  it("lucro operacional = 2936,1779", () => {
    expect(resultado.lucroOperacional).toBeCloseTo(2936.1779, 4);
  });

  it("margem = 0,3915 (39,15%)", () => {
    expect(resultado.margem).toBeCloseTo(0.3915, 4);
  });

  it("ponto de equilíbrio = 36,5106 sc/ha", () => {
    expect(resultado.pontoEquilibrio).toBeCloseTo(36.5106, 4);
  });

  it("custo por saca = 76,0637 R$/sc", () => {
    expect(resultado.custoPorSaca).toBeCloseTo(76.0637, 4);
  });

  it("preço da saca = precoDisp quando barter=false", () => {
    expect(resultado.precoSaca).toBe(125);
  });

  it("custo de arrendamento = 0 quando arrendamento=0", () => {
    expect(resultado.custoArrend).toBe(0);
  });
});

describe("calcular — configuração Alta Produtividade", () => {
  const resultado = calcular({
    produtividade: 70,
    precoDisp: 125,
    precoFuturo: 108,
    barter: false,
    arrendamento: 0,
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  });

  it("usa configuração Alta Produtividade (produtividade=70 > 60)", () => {
    expect(resultado.usaAlta).toBe(true);
  });

  it("opVal = 1400 (alta produtividade)", () => {
    expect(resultado.opVal).toBe(1400);
  });
});

describe("calcular — barter ativo usa preço futuro", () => {
  const resultado = calcular({
    produtividade: 60,
    precoDisp: 125,
    precoFuturo: 108,
    barter: true,
    arrendamento: 0,
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  });

  it("preço da saca = precoFuturo quando barter=true", () => {
    expect(resultado.precoSaca).toBe(108);
  });
});

describe("calcular — arrendamento converte sc/ha em R$", () => {
  const resultado = calcular({
    produtividade: 60,
    precoDisp: 125,
    precoFuturo: 108,
    barter: false,
    arrendamento: 10,
    insumosBaixo: INSUMOS_BAIXO_INIT,
    insumosAlta: INSUMOS_ALTA_INIT,
    operacional: OPERACIONAL_INIT,
  });

  it("custo arrendamento = 10 sc/ha × R$125 = R$1250", () => {
    expect(resultado.custoArrend).toBeCloseTo(1250, 4);
  });
});
