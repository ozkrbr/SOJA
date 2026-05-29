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
}

export interface CalcResult {
  usaAlta: boolean;
  insumos: number;
  opVal: number;
  investimentoTotal: number;
  precoSaca: number;
  receita: number;
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

/*
  Replica PRODUÇÃO SOJA:
  - se produtividade > base(60)  -> usa config ALTA produtividade
  - senão                        -> usa config BAIXO custo
  - preço da saca = barter? preçoFuturo : preçoDisp
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

  const custoArrend = (Number(arrendamento) || 0) * precoSaca;

  const custoTotal = investimentoTotal + custoArrend;
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
