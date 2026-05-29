export const BASE = 60;

export interface Insumo {
  produto: string;
  quantidade: number;
  familia: string;
  valor: number;
}

export interface CustoOperacionalConfig {
  plantio: number;
  colheita: number;
  manutencao: number;
  outros: number;
}

export interface Operacional {
  baixo: CustoOperacionalConfig;
  alta: CustoOperacionalConfig;
}

export interface CalcInput {
  produtividade: number;
  precoDisp: number;
  precoFuturo: number;
  barter: boolean;
  arrendamento: number;
  insumosBaixo: Insumo[];
  insumosAlta: Insumo[];
  operacional: Operacional;
  // parâmetros do barter (correção planilha revisada)
  taxaMensal?: number;       // decimal, ex.: 0.016 = 1,6% a.m.
  dataHoje?: string;         // 'YYYY-MM-DD'
  dataTravamento?: string;   // 'YYYY-MM-DD'
}

export interface CalcResult {
  usaAlta: boolean;
  insumos: number;
  opVal: number;
  investimentoTotal: number;
  precoSaca: number;
  receita: number;
  meses: number;
  custoBarter: number;
  custoArrend: number;
  custoTotal: number;
  lucroOperacional: number;
  margem: number;
  pontoEquilibrio: number;
  custoPorSaca: number;
  subBaixo: number;
  subAlta: number;
}

export function subtotalInsumos(lista: Insumo[]): number {
  return lista.reduce(
    (s, i) => s + (Number(i.quantidade) || 0) * (Number(i.valor) || 0),
    0
  );
}

export function somaOperacional(op: CustoOperacionalConfig): number {
  return (
    (Number(op.plantio) || 0) +
    (Number(op.colheita) || 0) +
    (Number(op.manutencao) || 0) +
    (Number(op.outros) || 0)
  );
}

/** Diferença em meses (dias/30), igual à fórmula da planilha. */
export function mesesEntre(dataInicio: string, dataFim: string): number {
  const ini = new Date(dataInicio);
  const fim = new Date(dataFim);
  if (isNaN(ini.getTime()) || isNaN(fim.getTime())) return 0;
  return (fim.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24) / 30;
}

/*
  Replica PRODUÇÃO SOJA + Planilha3 (versão CORRIGIDA):

  CORREÇÃO 1 — Barter com juros compostos:
    custoBarter = investimentoTotal × ((1 + taxaMensal)^meses − 1)
    meses = (dataTravamento − dataHoje) / 30

  CORREÇÃO 2 — Arrendamento usa SEMPRE o preço disponível:
    custoArrend = arrendamento(sc/ha) × precoDisp

  custoTotal = investimentoTotal + custoBarter + custoArrend
*/
export function calcular(input: CalcInput): CalcResult {
  const {
    produtividade,
    precoDisp,
    precoFuturo,
    barter,
    arrendamento,
    insumosBaixo,
    insumosAlta,
    operacional,
    taxaMensal = 0.016,
    dataHoje,
    dataTravamento,
  } = input;

  const usaAlta = produtividade > BASE;

  const subBaixo = subtotalInsumos(insumosBaixo);
  const subAlta = subtotalInsumos(insumosAlta);
  const insumos = usaAlta ? subAlta : subBaixo;

  const opVal = usaAlta
    ? somaOperacional(operacional.alta)
    : somaOperacional(operacional.baixo);
  const investimentoTotal = insumos + opVal;

  const precoSaca = barter ? precoFuturo : precoDisp;
  const receita = produtividade * precoSaca;

  // CORREÇÃO 1: custo financeiro do barter (juros compostos)
  const meses =
    barter && dataHoje && dataTravamento
      ? mesesEntre(dataHoje, dataTravamento)
      : 0;
  const custoBarter = barter
    ? investimentoTotal * (Math.pow(1 + (Number(taxaMensal) || 0), meses) - 1)
    : 0;

  // CORREÇÃO 2: arrendamento usa SEMPRE o preço disponível (à vista)
  const custoArrend = (Number(arrendamento) || 0) * precoDisp;

  const custoTotal = investimentoTotal + custoBarter + custoArrend;
  const lucroOperacional = receita - custoTotal;
  const margem = receita ? lucroOperacional / receita : 0;
  const pontoEquilibrio = precoSaca ? custoTotal / precoSaca : 0;
  const custoPorSaca = produtividade ? custoTotal / produtividade : 0;

  return {
    usaAlta,
    insumos,
    opVal,
    investimentoTotal,
    precoSaca,
    receita,
    meses,
    custoBarter,
    custoArrend,
    custoTotal,
    lucroOperacional,
    margem,
    pontoEquilibrio,
    custoPorSaca,
    subBaixo,
    subAlta,
  };
}
