import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, ReferenceArea, ComposedChart, Line, Legend,
} from "recharts";

/* ============================================================
   DADOS INICIAIS  (extraídos da planilha CUSTO_SOJA_2026.xlsx)
   ============================================================ */
const INSUMOS_BAIXO_INIT = [
  { produto: "TEBURAZ-BD20", quantidade: 0.5, familia: "FUNGICIDA", valor: 47.73 },
  { produto: "BLAVITY-GL05", quantidade: 0.25, familia: "FUNGICIDA", valor: 387.49 },
  { produto: "FUSAO EC-GL05", quantidade: 0.6, familia: "FUNGICIDA", valor: 90.95 },
  { produto: "ABSOLUTO FIX - BD20", quantidade: 1, familia: "FUNGICIDA", valor: 32.22 },
  { produto: "FASTAC 100 SC -GL05", quantidade: 0.4, familia: "INSETICIDA", valor: 45.13 },
  { produto: "TERMINUS-GL10", quantidade: 0.25, familia: "INSETICIDA", valor: 131.03 },
  { produto: "TALISMAN-GL05", quantidade: 0.6, familia: "INSETICIDA", valor: 74.4 },
  { produto: "Brafix -SOJA 2025", quantidade: 1, familia: "BIOLÓGICO", valor: 20 },
  { produto: "Auba-SOJA 2025", quantidade: 0.4, familia: "BIOLÓGICO", valor: 200 },
  { produto: "Tritter-SOJA 2025", quantidade: 0.1, familia: "BIOLÓGICO", valor: 390 },
  { produto: "AllNutri-20 LT", quantidade: 1, familia: "FOLIAR", valor: 21.4 },
  { produto: "Nutruss Man-20 LT", quantidade: 1, familia: "FOLIAR", valor: 19.25 },
  { produto: "Mutto - 5LT", quantidade: 0.2, familia: "FOLIAR", valor: 241.28 },
  { produto: "HEAVY-20 LT", quantidade: 5, familia: "FOLIAR", valor: 20.98 },
  { produto: "Fullgrain-20 LT", quantidade: 2, familia: "FOLIAR", valor: 20.33 },
  { produto: "Mageos--20 LT", quantidade: 1, familia: "FOLIAR", valor: 26.35 },
  { produto: "ZAFERA-SC20", quantidade: 4, familia: "HERBICIDA", valor: 26.14 },
  { produto: "ASSIST EC-BD20", quantidade: 1.25, familia: "OLEO MINERAL", valor: 29.15 },
  { produto: "Spray Max-SOJA 2025", quantidade: 0.25, familia: "ADJUVANTE", valor: 68 },
  { produto: "SEMENTE DE SOJA TORMENTA", quantidade: 0.052, familia: "SEMENTE", valor: 13243.3 },
  { produto: "07-45-00 ROB", quantidade: 0.18, familia: "FERTILIZANTE", valor: 7583 },
  { produto: "KCL GR", quantidade: 0.1, familia: "FERTILIZANTE", valor: 3346 },
  { produto: "FRETE CARRETA - 60 KMs", quantidade: 0.28, familia: "FRETE", valor: 53 },
];

const INSUMOS_ALTA_INIT = [
  { produto: "ONSUVA-GL05", quantidade: 0.3, familia: "FUNGICIDA", valor: 359.68 },
  { produto: "BELYAN-GL05", quantidade: 0.6, familia: "FUNGICIDA", valor: 427.1 },
  { produto: "BLAVITY-GL05", quantidade: 0.25, familia: "FUNGICIDA", valor: 439.9 },
  { produto: "KEYRA-GL10", quantidade: 0.5, familia: "FUNGICIDA", valor: 178.77 },
  { produto: "FASTAC 100 SC -GL05", quantidade: 0.4, familia: "INSETICIDA", valor: 48.18 },
  { produto: "BRIGHT-GL05", quantidade: 0.25, familia: "INSETICIDA", valor: 124.07 },
  { produto: "TALISMAN-GL05", quantidade: 0.6, familia: "INSETICIDA", valor: 69.09 },
  { produto: "ZEUS-GL10", quantidade: 0.5, familia: "INSETICIDA", valor: 72.64 },
  { produto: "Brafix -SOJA 2025", quantidade: 1, familia: "BIOLÓGICO", valor: 30 },
  { produto: "Auba-SOJA 2025", quantidade: 0.4, familia: "BIOLÓGICO", valor: 220 },
  { produto: "Tritter-SOJA 2025", quantidade: 0.15, familia: "BIOLÓGICO", valor: 360 },
  { produto: "Bettus-SOJA 2025", quantidade: 0.5, familia: "BIOLÓGICO", valor: 50 },
  { produto: "AllNutri-20 LT", quantidade: 1, familia: "FOLIAR", valor: 28 },
  { produto: "Nutruss Man-20 LT", quantidade: 1, familia: "FOLIAR", valor: 23 },
  { produto: "Mutto - 5LT", quantidade: 0.25, familia: "FOLIAR", valor: 270 },
  { produto: "HEAVY-20 LT", quantidade: 6, familia: "FOLIAR", valor: 27 },
  { produto: "Fullgrain-20 LT", quantidade: 4, familia: "FOLIAR", valor: 23 },
  { produto: "Mageos--20 LT", quantidade: 1, familia: "FOLIAR", valor: 32 },
  { produto: "Imncito-20 LT", quantidade: 1, familia: "FOLIAR", valor: 25 },
  { produto: "7-45-00NPS ROBUSTTO", quantidade: 0.22, familia: "FERTILIZANTE", valor: 7583 },
  { produto: "KCL CONVENCIONAL", quantidade: 0.15, familia: "FERTILIZANTE", valor: 3346 },
  { produto: "FRETE CARRETA - 60 KMs", quantidade: 0.37, familia: "FERTILIZANTE", valor: 53 },
  { produto: "ZAFERA-SC20", quantidade: 4, familia: "HERBICIDA", valor: 34.66 },
  { produto: "POQUER-BD20", quantidade: 1.4, familia: "HERBICIDA", valor: 48 },
  { produto: "AURORA 400 EC-GL05", quantidade: 0.1, familia: "HERBICIDA", valor: 454.14 },
  { produto: "ASSIST EC-BD20", quantidade: 1.25, familia: "OLEO MINERAL", valor: 20.54 },
  { produto: "Spray Max-SOJA 2025", quantidade: 0.25, familia: "ADJUVANTE", valor: 67 },
  { produto: "SEMENTE DE SOJA TORMENTA", quantidade: 0.05, familia: "SEMENTE", valor: 12314 },
];

const OPERACIONAL_INIT = {
  baixo: { plantio: 350, colheita: 250, manutencao: 400, outros: 300 },
  alta: { plantio: 350, colheita: 350, manutencao: 400, outros: 300 },
};

/* ============================================================
   CÁLCULOS  (réplica fiel das fórmulas da planilha)
   ============================================================ */
function subtotalInsumos(lista) {
  return lista.reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.valor) || 0), 0);
}
function somaOperacional(op) {
  return (Number(op.plantio) || 0) + (Number(op.colheita) || 0) + (Number(op.manutencao) || 0) + (Number(op.outros) || 0);
}

/*
  Replica PRODUÇÃO SOJA + Planilha3 (versão CORRIGIDA):
  - se produtividade > base(60)  -> usa config ALTA produtividade
  - senão                        -> usa config BAIXO custo
  - preço da saca = barter? preçoFuturo : preçoDisp
  - BARTER (corrigido): além de usar o preço futuro, aplica custo financeiro
    por juros COMPOSTOS sobre o investimento total, entre a data de hoje e a
    data de travamento. juros = invest × ((1+taxa)^meses − 1), meses=(dataTrav−hoje)/30
  - ARRENDAMENTO (corrigido): custo = arrendamento(sc/ha) × preço DISPONÍVEL
    (sempre o preço à vista, mesmo em cenário barter).
  - ÁREA PLANTIO: escala os indicadores por hectare para o total da fazenda.
    Ex.: lucroTotalFazenda = area × lucroOperacional/ha  (réplica de Q20 = Q3×E28).
*/
function mesesEntre(dataInicio, dataFim) {
  const ini = new Date(dataInicio);
  const fim = new Date(dataFim);
  if (isNaN(ini) || isNaN(fim)) return 0;
  return (fim - ini) / (1000 * 60 * 60 * 24) / 30; // dias/30, igual à planilha
}

function calcular({
  produtividade, precoDisp, precoFuturo, barter, arrendamento,
  insumosBaixo, insumosAlta, operacional,
  // parâmetros do barter (corrigido)
  taxaMensal = 0.016, dataHoje, dataTravamento,
  // área de plantio em hectares
  area = 1,
}) {
  const base = 60;
  const usaAlta = produtividade > base;

  const subBaixo = subtotalInsumos(insumosBaixo);
  const subAlta = subtotalInsumos(insumosAlta);
  const insumos = usaAlta ? subAlta : subBaixo;

  const opVal = usaAlta ? somaOperacional(operacional.alta) : somaOperacional(operacional.baixo);
  const investimentoTotal = insumos + opVal;

  const precoSaca = barter ? precoFuturo : precoDisp;
  const receita = produtividade * precoSaca;

  // --- CORREÇÃO 1: custo financeiro do barter (juros compostos) ---
  const meses = barter ? mesesEntre(dataHoje, dataTravamento) : 0;
  const custoBarter = barter
    ? investimentoTotal * (Math.pow(1 + (Number(taxaMensal) || 0), meses) - 1)
    : 0;

  // --- CORREÇÃO 2: arrendamento usa SEMPRE o preço disponível ---
  const custoArrend = (Number(arrendamento) || 0) * precoDisp;

  const custoTotal = investimentoTotal + custoBarter + custoArrend;
  const lucroOperacional = receita - custoTotal;
  const margem = receita ? lucroOperacional / receita : 0;
  const pontoEquilibrio = precoSaca ? custoTotal / precoSaca : 0;
  const custoPorSaca = produtividade ? custoTotal / produtividade : 0;

  // --- ÁREA PLANTIO: totais escalados pela fazenda (réplica do bloco Q) ---
  const ha = Number(area) || 0;
  const receitaTotalFazenda = receita * ha;
  const custoTotalFazenda = custoTotal * ha;
  const investimentoTotalFazenda = investimentoTotal * ha;
  const lucroTotalFazenda = lucroOperacional * ha; // Q20 = Q3 × E28
  const producaoTotalFazenda = produtividade * ha; // sacas totais

  return {
    usaAlta, insumos, opVal, investimentoTotal, precoSaca, receita,
    custoBarter, custoArrend, custoTotal, lucroOperacional, margem,
    pontoEquilibrio, custoPorSaca, subBaixo, subAlta, meses,
    area: ha, receitaTotalFazenda, custoTotalFazenda,
    investimentoTotalFazenda, lucroTotalFazenda, producaoTotalFazenda,
  };
}

/* ============================================================
   HELPERS
   ============================================================ */
const fmtBRL = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtNum = (n, d = 1) =>
  (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtPct = (n) => (Number(n) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";

const FAM_COLORS = {
  FUNGICIDA: "#6b8f3f", INSETICIDA: "#a8451f", BIOLÓGICO: "#3f7d6b",
  FOLIAR: "#8a9b3a", HERBICIDA: "#b5882a", FERTILIZANTE: "#5a4632",
  SEMENTE: "#7a5c2e", "OLEO MINERAL": "#999", ADJUVANTE: "#777", FRETE: "#555",
};
const corFam = (f) => FAM_COLORS[f] || "#888";

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
export default function CustoSoja() {
  // Parâmetros editáveis (os 5 campos da imagem)
  const [produtividade, setProdutividade] = useState(60);
  const [precoDisp, setPrecoDisp] = useState(125);
  const [precoFuturo, setPrecoFuturo] = useState(108);
  const [barter, setBarter] = useState(false);
  const [arrendamento, setArrendamento] = useState(0);
  const [area, setArea] = useState(400); // hectares de plantio
  // Parâmetros do barter (correção): taxa mensal e datas
  const [taxaMensal, setTaxaMensal] = useState(1.6); // em % a.m. (UI), convertida abaixo
  const [dataHoje, setDataHoje] = useState(new Date().toISOString().slice(0, 10));
  const [dataTravamento, setDataTravamento] = useState("2027-04-30");

  const [insumosBaixo, setInsumosBaixo] = useState(INSUMOS_BAIXO_INIT);
  const [insumosAlta, setInsumosAlta] = useState(INSUMOS_ALTA_INIT);
  const [operacional, setOperacional] = useState(OPERACIONAL_INIT);

  const [aba, setAba] = useState("painel");
  const [configInsumo, setConfigInsumo] = useState("baixo");
  const [cenarios, setCenarios] = useState([]);
  const [nomeCenario, setNomeCenario] = useState("");
  const [loadingC, setLoadingC] = useState(true);

  const R = useMemo(
    () => calcular({
      produtividade, precoDisp, precoFuturo, barter, arrendamento,
      insumosBaixo, insumosAlta, operacional,
      taxaMensal: (Number(taxaMensal) || 0) / 100, dataHoje, dataTravamento,
      area,
    }),
    [produtividade, precoDisp, precoFuturo, barter, arrendamento, insumosBaixo, insumosAlta, operacional, taxaMensal, dataHoje, dataTravamento, area]
  );

  /* ---- Persistência de cenários ---- */
  useEffect(() => {
    (async () => {
      try {
        const list = await window.storage.list("cenario:");
        if (list?.keys?.length) {
          const items = [];
          for (const k of list.keys) {
            try {
              const r = await window.storage.get(k.key ?? k);
              if (r?.value) items.push(JSON.parse(r.value));
            } catch {}
          }
          items.sort((a, b) => b.ts - a.ts);
          setCenarios(items);
        }
      } catch {}
      setLoadingC(false);
    })();
  }, []);

  async function salvarCenario() {
    const nome = nomeCenario.trim() || `Cenário ${new Date().toLocaleString("pt-BR")}`;
    const id = "cenario:" + Date.now();
    const obj = {
      id, nome, ts: Date.now(),
      params: { produtividade, precoDisp, precoFuturo, barter, arrendamento, taxaMensal, dataHoje, dataTravamento, area },
      resumo: {
        investimentoTotal: R.investimentoTotal, receita: R.receita,
        lucroOperacional: R.lucroOperacional, margem: R.margem,
        pontoEquilibrio: R.pontoEquilibrio, custoPorSaca: R.custoPorSaca,
        precoSaca: R.precoSaca, usaAlta: R.usaAlta, custoBarter: R.custoBarter,
        lucroTotalFazenda: R.lucroTotalFazenda, area: R.area,
      },
    };
    try {
      await window.storage.set(id, JSON.stringify(obj));
      setCenarios((c) => [obj, ...c]);
      setNomeCenario("");
    } catch (e) {
      alert("Não foi possível salvar o cenário.");
    }
  }
  async function removerCenario(id) {
    try { await window.storage.delete(id); } catch {}
    setCenarios((c) => c.filter((x) => x.id !== id));
  }
  function carregarCenario(c) {
    setProdutividade(c.params.produtividade);
    setPrecoDisp(c.params.precoDisp);
    setPrecoFuturo(c.params.precoFuturo);
    setBarter(c.params.barter);
    setArrendamento(c.params.arrendamento);
    if (c.params.taxaMensal != null) setTaxaMensal(c.params.taxaMensal);
    if (c.params.dataHoje) setDataHoje(c.params.dataHoje);
    if (c.params.dataTravamento) setDataTravamento(c.params.dataTravamento);
    if (c.params.area != null) setArea(c.params.area);
    setAba("painel");
  }

  /* ---- Dados de gráficos ---- */
  const dadosCusto = useMemo(() => {
    const lista = R.usaAlta ? insumosAlta : insumosBaixo;
    const map = {};
    lista.forEach((i) => {
      const t = (Number(i.quantidade) || 0) * (Number(i.valor) || 0);
      map[i.familia] = (map[i.familia] || 0) + t;
    });
    return Object.entries(map).map(([familia, valor]) => ({ familia, valor })).sort((a, b) => b.valor - a.valor);
  }, [R.usaAlta, insumosAlta, insumosBaixo]);

  const dadosSensibilidade = useMemo(() => {
    const out = [];
    for (let p = 40; p <= 90; p += 5) {
      const c = calcular({
        produtividade: p, precoDisp, precoFuturo, barter, arrendamento,
        insumosBaixo, insumosAlta, operacional,
        taxaMensal: (Number(taxaMensal) || 0) / 100, dataHoje, dataTravamento,
        area,
      });
      out.push({
        prod: p,
        lucro: Math.round(c.lucroOperacional),
        custoSc: c.custoPorSaca,
        config: c.usaAlta ? "alta" : "baixo",
      });
    }
    return out;
  }, [precoDisp, precoFuturo, barter, arrendamento, insumosBaixo, insumosAlta, operacional, taxaMensal, dataHoje, dataTravamento, area]);

  return (
    <div style={S.wrap}>
      <style>{CSS}</style>

      {/* Cabeçalho */}
      <header style={S.header}>
        <div>
          <div style={S.kicker}>TERRENA AGRONEGÓCIOS</div>
          <h1 style={S.h1}>Custo de Produção — Soja 2026</h1>
          <p style={S.sub}>Simulador de custos e rentabilidade por hectare</p>
        </div>
        <div style={S.cfgBadge}>
          <span style={{ ...S.dot, background: R.usaAlta ? "#b5882a" : "#6b8f3f" }} />
          Config. ativa: <strong>{R.usaAlta ? "Alta Produtividade" : "Baixo Custo"}</strong>
        </div>
      </header>

      {/* ===== Parâmetros editáveis (campos da imagem) ===== */}
      <section style={S.paramsRow}>
        <ParamCard label="PRODUTIVIDADE" unit="sc/ha" value={produtividade} onChange={setProdutividade} step={1} accent="#6b8f3f" />
        <ParamCard label="ÁREA PLANTIO" unit="ha" value={area} onChange={setArea} step={10} accent="#7a5c2e" />
        <ParamCard label="PREÇO DISPONÍVEL" sub="commodity (dia)" unit="R$/sc" value={precoDisp} onChange={setPrecoDisp} step={0.5} accent="#3f7d6b" />
        <ParamCard label="PREÇO FUTURO" sub="travamento em bolsa" unit="R$/sc" value={precoFuturo} onChange={setPrecoFuturo} step={0.5} accent="#b5882a" />
        <div style={S.paramCard}>
          <div style={S.paramLabel}>BARTER</div>
          <div style={S.paramSub}>troca por insumo</div>
          <button onClick={() => setBarter((b) => !b)} style={{ ...S.toggle, background: barter ? "#a8451f" : "#e6e0d4", color: barter ? "#fff" : "#5a4632" }}>
            {barter ? "SIM" : "NÃO"}
          </button>
          <div style={S.paramUnit}>{barter ? "usa preço futuro" : "usa preço disp."}</div>
        </div>
        <ParamCard label="ARRENDAMENTO" unit="sc/ha" value={arrendamento} onChange={setArrendamento} step={1} accent="#5a4632" />
      </section>

      {/* ===== Parâmetros do barter (aparecem quando barter = SIM) ===== */}
      {barter && (
        <section style={S.barterBox} className="fade">
          <div style={S.barterHead}>
            <strong>Condições do barter</strong>
            <span style={S.barterInfo}>
              custo financeiro: <strong>{fmtBRL(R.custoBarter)}</strong> · {fmtNum(R.meses)} meses · juros compostos
            </span>
          </div>
          <div style={S.barterGrid}>
            <label style={S.barterField}>
              <span>Taxa mensal (% a.m.)</span>
              <input type="number" step="0.01" value={taxaMensal}
                onChange={(e) => setTaxaMensal(e.target.value === "" ? 0 : Number(e.target.value))} style={S.barterInput} />
            </label>
            <label style={S.barterField}>
              <span>Data de hoje</span>
              <input type="date" value={dataHoje} onChange={(e) => setDataHoje(e.target.value)} style={S.barterInput} />
            </label>
            <label style={S.barterField}>
              <span>Data de travamento</span>
              <input type="date" value={dataTravamento} onChange={(e) => setDataTravamento(e.target.value)} style={S.barterInput} />
            </label>
          </div>
          <p style={S.barterNote}>
            O custo do barter incide sobre o investimento total (insumos + operacional), corrigido por juros compostos no período. O arrendamento é sempre calculado pelo preço disponível.
          </p>
        </section>
      )}

      {/* ===== Tabs ===== */}
      <nav style={S.tabs}>
        {[
          ["painel", "Painel"],
          ["insumos", "Insumos"],
          ["operacional", "Operacional"],
          ["analise", "Análise"],
          ["cenarios", "Cenários"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)} style={{ ...S.tab, ...(aba === id ? S.tabActive : {}) }}>
            {label}
          </button>
        ))}
      </nav>

      {/* ===== PAINEL ===== */}
      {aba === "painel" && (
        <div className="fade">
          <div style={S.scopeLabel}>Por hectare</div>
          <section style={S.kpiGrid}>
            <Kpi big title="Receita Bruta" value={fmtBRL(R.receita)} sub={`${produtividade} sc × ${fmtBRL(R.precoSaca)}`} accent="#3f7d6b" />
            <Kpi big title="Custo Total" value={fmtBRL(R.custoTotal)}
              sub={`Invest. ${fmtBRL(R.investimentoTotal)} + Barter ${fmtBRL(R.custoBarter)} + Arrend. ${fmtBRL(R.custoArrend)}`} accent="#a8451f" />
            <Kpi big title="Lucro Operacional" value={fmtBRL(R.lucroOperacional)} sub={`Margem ${fmtPct(R.margem)}`} accent={R.lucroOperacional >= 0 ? "#6b8f3f" : "#a8451f"} />
          </section>
          <section style={S.kpiGrid}>
            <Kpi title="Margem Operacional" value={fmtPct(R.margem)} accent="#b5882a" />
            <Kpi title="Ponto de Equilíbrio" value={`${fmtNum(R.pontoEquilibrio)} sc/ha`} sub={`de ${produtividade} sc/ha`} accent="#a8451f" />
            <Kpi title="Custo por Saca" value={fmtBRL(R.custoPorSaca)} sub={`venda a ${fmtBRL(R.precoSaca)}`} accent="#5a4632" />
            <Kpi title="Ganho por Saca" value={fmtBRL(R.precoSaca - R.custoPorSaca)} accent={R.precoSaca - R.custoPorSaca >= 0 ? "#6b8f3f" : "#a8451f"} />
          </section>

          {/* Totais da fazenda (escalados pela área) */}
          <div style={S.scopeLabel}>Total da fazenda — {fmtNum(R.area, 0)} ha</div>
          <section style={S.kpiGrid}>
            <Kpi big title="Receita Total" value={fmtBRL(R.receitaTotalFazenda)} sub={`${fmtNum(R.producaoTotalFazenda, 0)} sacas`} accent="#3f7d6b" />
            <Kpi big title="Custo Total" value={fmtBRL(R.custoTotalFazenda)} sub={`Investimento ${fmtBRL(R.investimentoTotalFazenda)}`} accent="#5a4632" />
            <Kpi big title={R.lucroTotalFazenda >= 0 ? "Lucro Operacional Total" : "Prejuízo Operacional Total"}
              value={fmtBRL(R.lucroTotalFazenda)} sub={`${fmtNum(R.area, 0)} ha × ${fmtBRL(R.lucroOperacional)}/ha`}
              accent={R.lucroTotalFazenda >= 0 ? "#6b8f3f" : "#a8451f"} />
          </section>

          {/* Barra de equilíbrio */}
          <section style={S.panel}>
            <h3 style={S.panelTitle}>Margem de segurança</h3>
            <div style={S.beBar}>
              <div style={{ ...S.beFill, width: `${Math.min(100, (R.pontoEquilibrio / produtividade) * 100)}%` }} />
              <div style={{ ...S.beMarker, left: `${Math.min(100, (R.pontoEquilibrio / produtividade) * 100)}%` }} />
            </div>
            <div style={S.beLabels}>
              <span>Equilíbrio: <strong>{fmtNum(R.pontoEquilibrio)} sc/ha</strong></span>
              <span>Meta: <strong>{produtividade} sc/ha</strong></span>
            </div>
            <p style={S.beNote}>
              {R.pontoEquilibrio < produtividade
                ? `Acima do equilíbrio por ${fmtNum(produtividade - R.pontoEquilibrio)} sc/ha — sobra de segurança.`
                : `Atenção: o equilíbrio está acima da produtividade esperada.`}
            </p>
          </section>
        </div>
      )}

      {/* ===== INSUMOS ===== */}
      {aba === "insumos" && (
        <div className="fade">
          <div style={S.subTabs}>
            <button onClick={() => setConfigInsumo("baixo")} style={{ ...S.subTab, ...(configInsumo === "baixo" ? S.subTabActive : {}) }}>
              Baixo Custo · {fmtBRL(R.subBaixo)}
            </button>
            <button onClick={() => setConfigInsumo("alta")} style={{ ...S.subTab, ...(configInsumo === "alta" ? S.subTabActive : {}) }}>
              Alta Produtividade · {fmtBRL(R.subAlta)}
            </button>
          </div>
          <TabelaInsumos
            lista={configInsumo === "baixo" ? insumosBaixo : insumosAlta}
            setLista={configInsumo === "baixo" ? setInsumosBaixo : setInsumosAlta}
          />
        </div>
      )}

      {/* ===== OPERACIONAL ===== */}
      {aba === "operacional" && (
        <div className="fade" style={S.panel}>
          <h3 style={S.panelTitle}>Custos operacionais (R$/ha)</h3>
          <div style={S.opGrid}>
            <div />
            <div style={S.opHead}>Baixo Custo</div>
            <div style={S.opHead}>Alta Produt.</div>
            {[["plantio", "Plantio"], ["colheita", "Colheita"], ["manutencao", "Manutenção"], ["outros", "Outros (ADM)"]].map(([k, label]) => (
              <React.Fragment key={k}>
                <div style={S.opLabel}>{label}</div>
                <input type="number" style={S.opInput} value={operacional.baixo[k]}
                  onChange={(e) => setOperacional((o) => ({ ...o, baixo: { ...o.baixo, [k]: Number(e.target.value) } }))} />
                <input type="number" style={S.opInput} value={operacional.alta[k]}
                  onChange={(e) => setOperacional((o) => ({ ...o, alta: { ...o.alta, [k]: Number(e.target.value) } }))} />
              </React.Fragment>
            ))}
            <div style={{ ...S.opLabel, fontWeight: 700 }}>Subtotal</div>
            <div style={S.opTotal}>{fmtBRL(somaOperacional(operacional.baixo))}</div>
            <div style={S.opTotal}>{fmtBRL(somaOperacional(operacional.alta))}</div>
          </div>
        </div>
      )}

      {/* ===== ANÁLISE ===== */}
      {aba === "analise" && (
        <div className="fade">
          <section style={S.panel}>
            <h3 style={S.panelTitle}>Composição do custo de insumos por família — {R.usaAlta ? "Alta Produtividade" : "Baixo Custo"}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosCusto} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d4" />
                <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="familia" width={95} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmtBRL(v)} />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {dadosCusto.map((d, i) => <Cell key={i} fill={corFam(d.familia)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section style={S.panel}>
            <h3 style={S.panelTitle}>Sensibilidade à produtividade</h3>
            <p style={S.panelSub}>Lucro operacional (R$/ha) e custo por saca conforme a produtividade muda. A linha em <strong>60 sc/ha</strong> marca a transição automática de configuração.</p>
            <div style={S.legendZonas}>
              <span style={S.legendItem}><span style={{ ...S.legendSwatch, background: "rgba(107,143,63,.14)" }} /> Zona Baixo Custo (≤ 60 sc/ha)</span>
              <span style={S.legendItem}><span style={{ ...S.legendSwatch, background: "rgba(181,136,42,.16)" }} /> Zona Alta Produtividade (&gt; 60 sc/ha)</span>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={dadosSensibilidade} margin={{ left: 10, right: 10, top: 10 }}>
                {/* Zonas de configuração ao fundo */}
                <ReferenceArea x1={40} x2={60} yAxisId="l" fill="#6b8f3f" fillOpacity={0.08} />
                <ReferenceArea x1={60} x2={90} yAxisId="l" fill="#b5882a" fillOpacity={0.1} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d4" />
                <XAxis dataKey="prod" tick={{ fontSize: 11 }} label={{ value: "sc/ha", position: "insideBottomRight", offset: -4, fontSize: 11 }} />
                <YAxis yAxisId="l" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v, n) => n === "Lucro op. (R$/ha)" ? fmtBRL(v) : fmtBRL(v)}
                  labelFormatter={(p) => {
                    const pt = dadosSensibilidade.find((d) => d.prod === p);
                    return `${p} sc/ha · ${pt?.config === "alta" ? "Alta Produtividade" : "Baixo Custo"}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine yAxisId="l" y={0} stroke="#a8451f" strokeDasharray="4 4" />
                {/* Marcador da transição de configuração em 60 sc/ha */}
                <ReferenceLine yAxisId="l" x={60} stroke="#5a4632" strokeWidth={2}
                  label={{ value: "transição de configuração", position: "top", fontSize: 11, fill: "#5a4632" }} />
                <Bar yAxisId="l" dataKey="lucro" name="Lucro op. (R$/ha)" radius={[3, 3, 0, 0]}>
                  {dadosSensibilidade.map((d, i) => (
                    <Cell key={i} fill={d.lucro >= 0 ? (d.config === "alta" ? "#b5882a" : "#6b8f3f") : "#a8451f"} />
                  ))}
                </Bar>
                <Line yAxisId="r" dataKey="custoSc" name="Custo/saca (R$)" stroke="#5a4632" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <p style={S.beNote}>
              Até 60 sc/ha o modelo usa a cesta de insumos <strong>Baixo Custo</strong> (barras verdes); acima de 60, salta para <strong>Alta Produtividade</strong> (barras âmbar), com insumos e custo operacional maiores. O degrau no gráfico mostra esse salto de investimento.
            </p>
          </section>
        </div>
      )}

      {/* ===== CENÁRIOS ===== */}
      {aba === "cenarios" && (
        <div className="fade">
          <section style={S.panel}>
            <h3 style={S.panelTitle}>Salvar cenário atual</h3>
            <div style={S.salvarRow}>
              <input placeholder="Nome do cenário (ex.: Barter 70sc com fertilizante alto)" value={nomeCenario}
                onChange={(e) => setNomeCenario(e.target.value)} style={S.nomeInput} />
              <button onClick={salvarCenario} style={S.btnPrimary}>Salvar</button>
            </div>
            <div style={S.chipRow}>
              <Chip>Prod: {produtividade} sc/ha</Chip>
              <Chip>Área: {area} ha</Chip>
              <Chip>Disp: {fmtBRL(precoDisp)}</Chip>
              <Chip>Futuro: {fmtBRL(precoFuturo)}</Chip>
              <Chip>Barter: {barter ? "Sim" : "Não"}</Chip>
              <Chip>Arrend: {arrendamento} sc/ha</Chip>
            </div>
          </section>

          <section style={S.panel}>
            <h3 style={S.panelTitle}>Cenários salvos {cenarios.length ? `(${cenarios.length})` : ""}</h3>
            {loadingC && <p style={S.muted}>Carregando…</p>}
            {!loadingC && !cenarios.length && <p style={S.muted}>Nenhum cenário salvo ainda.</p>}
            <div style={S.cenList}>
              {cenarios.map((c) => (
                <div key={c.id} style={S.cenCard}>
                  <div style={S.cenTop}>
                    <strong style={{ fontSize: 14 }}>{c.nome}</strong>
                    <span style={{ ...S.tagCfg, background: c.resumo.usaAlta ? "#b5882a" : "#6b8f3f" }}>
                      {c.resumo.usaAlta ? "Alta" : "Baixo"}
                    </span>
                  </div>
                  <div style={S.cenGrid}>
                    <span>Lucro/ha</span><strong style={{ color: c.resumo.lucroOperacional >= 0 ? "#6b8f3f" : "#a8451f" }}>{fmtBRL(c.resumo.lucroOperacional)}</strong>
                    <span>Margem</span><strong>{fmtPct(c.resumo.margem)}</strong>
                    <span>Custo/saca</span><strong>{fmtBRL(c.resumo.custoPorSaca)}</strong>
                    <span>Equilíbrio</span><strong>{fmtNum(c.resumo.pontoEquilibrio)} sc</strong>
                    {c.resumo.lucroTotalFazenda != null && (
                      <>
                        <span>Total fazenda</span>
                        <strong style={{ color: c.resumo.lucroTotalFazenda >= 0 ? "#6b8f3f" : "#a8451f" }}>
                          {fmtBRL(c.resumo.lucroTotalFazenda)}{c.resumo.area ? ` · ${fmtNum(c.resumo.area, 0)} ha` : ""}
                        </strong>
                      </>
                    )}
                  </div>
                  <div style={S.cenActions}>
                    <button onClick={() => carregarCenario(c)} style={S.btnSmall}>Carregar</button>
                    <button onClick={() => removerCenario(c.id)} style={S.btnSmallGhost}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
            {cenarios.length > 1 && <p style={S.muted}>Dica: carregue cenários diferentes para comparar lado a lado os resultados.</p>}
          </section>
        </div>
      )}

      <footer style={S.footer}>
        Modelo replicado da planilha CUSTO_SOJA_2026 · valores recalculados em tempo real · cenários salvos localmente
      </footer>
    </div>
  );
}

/* ============================================================
   SUBCOMPONENTES
   ============================================================ */
function ParamCard({ label, sub, unit, value, onChange, step, accent }) {
  return (
    <div style={{ ...S.paramCard, borderTopColor: accent }}>
      <div style={S.paramLabel}>{label}</div>
      {sub && <div style={S.paramSub}>{sub}</div>}
      <input type="number" step={step} value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        style={{ ...S.paramInput, color: accent }} />
      <div style={S.paramUnit}>{unit}</div>
    </div>
  );
}

function Kpi({ title, value, sub, accent, big }) {
  return (
    <div style={{ ...S.kpi, ...(big ? S.kpiBig : {}), borderLeftColor: accent }}>
      <div style={S.kpiTitle}>{title}</div>
      <div style={{ ...S.kpiValue, ...(big ? { fontSize: 26 } : {}) }}>{value}</div>
      {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
  );
}

function Chip({ children }) {
  return <span style={S.chip}>{children}</span>;
}

function TabelaInsumos({ lista, setLista }) {
  const total = subtotalInsumos(lista);
  function upd(i, campo, v) {
    setLista((l) => l.map((it, idx) => idx === i ? { ...it, [campo]: campo === "produto" || campo === "familia" ? v : (v === "" ? 0 : Number(v)) } : it));
  }
  function remover(i) { setLista((l) => l.filter((_, idx) => idx !== i)); }
  function adicionar() { setLista((l) => [...l, { produto: "Novo insumo", quantidade: 0, familia: "FOLIAR", valor: 0 }]); }

  return (
    <div style={S.panel}>
      <div style={S.tableScroll}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Produto</th>
              <th style={{ ...S.th, textAlign: "center" }}>Família</th>
              <th style={{ ...S.th, textAlign: "right" }}>Qtde</th>
              <th style={{ ...S.th, textAlign: "right" }}>Valor (R$)</th>
              <th style={{ ...S.th, textAlign: "right" }}>Total (R$/ha)</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((it, i) => (
              <tr key={i} style={i % 2 ? S.trAlt : undefined}>
                <td style={S.td}><input style={S.cellInput} value={it.produto} onChange={(e) => upd(i, "produto", e.target.value)} /></td>
                <td style={{ ...S.td, textAlign: "center" }}>
                  <span style={{ ...S.famTag, background: corFam(it.familia) }}>{it.familia}</span>
                </td>
                <td style={S.td}><input type="number" step="0.01" style={{ ...S.cellInput, textAlign: "right" }} value={it.quantidade} onChange={(e) => upd(i, "quantidade", e.target.value)} /></td>
                <td style={S.td}><input type="number" step="0.01" style={{ ...S.cellInput, textAlign: "right" }} value={it.valor} onChange={(e) => upd(i, "valor", e.target.value)} /></td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtBRL((it.quantidade || 0) * (it.valor || 0))}</td>
                <td style={{ ...S.td, textAlign: "center" }}><button onClick={() => remover(i)} style={S.delBtn}>×</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ ...S.td, fontWeight: 700, borderTop: "2px solid #5a4632" }}>SUBTOTAL INSUMOS</td>
              <td style={{ ...S.td, textAlign: "right", fontWeight: 700, borderTop: "2px solid #5a4632", color: "#5a4632" }}>{fmtBRL(total)}</td>
              <td style={{ borderTop: "2px solid #5a4632" }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <button onClick={adicionar} style={S.btnAdd}>+ Adicionar insumo</button>
    </div>
  );
}

/* ============================================================
   ESTILOS
   ============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
.fade { animation: fade .35s ease; }
@keyframes fade { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:none;} }
input:focus { outline: 2px solid #6b8f3f; outline-offset: -1px; }
::-webkit-scrollbar { height: 8px; width: 8px; }
::-webkit-scrollbar-thumb { background: #cabfa6; border-radius: 4px; }
`;

const S = {
  wrap: { fontFamily: "'Public Sans', sans-serif", background: "#f4f1e9", color: "#2c2417", minHeight: "100%", padding: "20px 22px 40px", maxWidth: 1180, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", borderBottom: "2px solid #d8d0bd", paddingBottom: 16 },
  kicker: { fontSize: 11, letterSpacing: 2, color: "#8a7d5f", fontWeight: 700 },
  h1: { fontFamily: "'Fraunces', serif", fontSize: 30, margin: "4px 0 2px", color: "#2c2417", fontWeight: 600 },
  sub: { margin: 0, color: "#776b52", fontSize: 14 },
  cfgBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5a4632", background: "#fff", padding: "8px 14px", borderRadius: 10, border: "1px solid #e0d8c5" },
  dot: { width: 10, height: 10, borderRadius: "50%" },

  paramsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, margin: "20px 0" },
  paramCard: { background: "#fff", border: "1px solid #e6e0d4", borderTop: "3px solid #6b8f3f", borderRadius: 12, padding: "14px 14px 12px", textAlign: "center", boxShadow: "0 1px 2px rgba(90,70,50,.04)" },
  paramLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "#5a4632" },
  paramSub: { fontSize: 10, color: "#9a8d70", marginTop: 2, height: 12 },
  paramInput: { width: "100%", border: "none", borderBottom: "2px solid #e6e0d4", background: "transparent", textAlign: "center", fontSize: 26, fontWeight: 700, fontFamily: "'Fraunces', serif", padding: "6px 0 2px", margin: "6px 0 2px" },
  paramUnit: { fontSize: 11, color: "#9a8d70" },
  toggle: { width: "100%", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 18, fontWeight: 800, cursor: "pointer", margin: "10px 0 4px", fontFamily: "'Fraunces', serif", transition: "all .2s" },

  barterBox: { background: "#fff", border: "1px solid #e6d3c5", borderLeft: "4px solid #a8451f", borderRadius: 12, padding: "14px 16px", marginBottom: 18 },
  barterHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 },
  barterInfo: { fontSize: 13, color: "#776b52" },
  barterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 },
  barterField: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#5a4632", fontWeight: 600 },
  barterInput: { border: "1px solid #e0d8c5", borderRadius: 8, padding: "9px 11px", fontSize: 14, fontFamily: "inherit" },
  barterNote: { fontSize: 12, color: "#9a8d70", margin: "12px 0 0" },

  tabs: { display: "flex", gap: 4, borderBottom: "2px solid #d8d0bd", marginBottom: 20, flexWrap: "wrap" },
  tab: { border: "none", background: "transparent", padding: "10px 16px", fontSize: 14, fontWeight: 600, color: "#8a7d5f", cursor: "pointer", borderBottom: "3px solid transparent", marginBottom: -2 },
  tabActive: { color: "#2c2417", borderBottomColor: "#6b8f3f" },

  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 12 },
  kpi: { background: "#fff", borderRadius: 12, padding: "14px 16px", borderLeft: "4px solid #6b8f3f", border: "1px solid #e6e0d4", borderLeftWidth: 4 },
  kpiBig: { padding: "18px 18px" },
  kpiTitle: { fontSize: 12, color: "#8a7d5f", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontSize: 21, fontWeight: 700, fontFamily: "'Fraunces', serif", margin: "4px 0 2px" },
  kpiSub: { fontSize: 12, color: "#9a8d70" },

  panel: { background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #e6e0d4", marginBottom: 14 },
  scopeLabel: { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#8a7d5f", margin: "4px 2px 8px" },
  legendZonas: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 },
  legendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5a4632" },
  legendSwatch: { width: 16, height: 12, borderRadius: 3, display: "inline-block", border: "1px solid #e0d8c5" },
  panelTitle: { fontFamily: "'Fraunces', serif", fontSize: 17, margin: "0 0 12px", color: "#2c2417", fontWeight: 600 },
  panelSub: { fontSize: 13, color: "#776b52", margin: "-6px 0 12px" },

  beBar: { position: "relative", height: 26, background: "linear-gradient(90deg,#e8eddc,#d9e4c4)", borderRadius: 6, overflow: "hidden" },
  beFill: { position: "absolute", left: 0, top: 0, bottom: 0, background: "linear-gradient(90deg,#c97f4a,#a8451f)", opacity: 0.85 },
  beMarker: { position: "absolute", top: -4, bottom: -4, width: 3, background: "#2c2417" },
  beLabels: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5a4632", marginTop: 8 },
  beNote: { fontSize: 13, color: "#776b52", marginTop: 6, marginBottom: 0 },

  subTabs: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  subTab: { border: "1px solid #e0d8c5", background: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#8a7d5f", cursor: "pointer" },
  subTabActive: { background: "#5a4632", color: "#fff", borderColor: "#5a4632" },

  tableScroll: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 },
  th: { textAlign: "left", padding: "8px 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#8a7d5f", borderBottom: "2px solid #e6e0d4" },
  td: { padding: "4px 10px", borderBottom: "1px solid #f0ebde" },
  trAlt: { background: "#faf8f1" },
  cellInput: { width: "100%", border: "1px solid transparent", background: "transparent", padding: "6px 6px", fontSize: 13, borderRadius: 6, fontFamily: "inherit" },
  famTag: { display: "inline-block", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, letterSpacing: 0.3 },
  delBtn: { border: "none", background: "#f0ebde", color: "#a8451f", width: 24, height: 24, borderRadius: 6, cursor: "pointer", fontSize: 16, lineHeight: 1 },
  btnAdd: { marginTop: 12, border: "1px dashed #b5a988", background: "transparent", color: "#5a4632", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" },

  opGrid: { display: "grid", gridTemplateColumns: "1fr 130px 130px", gap: 8, alignItems: "center", maxWidth: 520 },
  opHead: { fontSize: 12, fontWeight: 700, color: "#5a4632", textAlign: "center" },
  opLabel: { fontSize: 14, color: "#3c3526" },
  opInput: { border: "1px solid #e0d8c5", borderRadius: 8, padding: "8px 10px", fontSize: 14, textAlign: "right", fontFamily: "inherit" },
  opTotal: { textAlign: "right", fontWeight: 700, color: "#5a4632", padding: "6px 10px", fontFamily: "'Fraunces', serif", fontSize: 16 },

  salvarRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  nomeInput: { flex: 1, minWidth: 220, border: "1px solid #e0d8c5", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit" },
  btnPrimary: { border: "none", background: "#6b8f3f", color: "#fff", padding: "11px 24px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 },
  chip: { background: "#f0ebde", color: "#5a4632", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },

  cenList: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 },
  cenCard: { border: "1px solid #e6e0d4", borderRadius: 12, padding: 14, background: "#faf8f1" },
  cenTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  tagCfg: { color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20 },
  cenGrid: { display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 10px", fontSize: 13, color: "#776b52", marginBottom: 12 },
  cenActions: { display: "flex", gap: 8 },
  btnSmall: { flex: 1, border: "none", background: "#5a4632", color: "#fff", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  btnSmallGhost: { border: "1px solid #d8c9b0", background: "transparent", color: "#a8451f", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 },

  muted: { color: "#9a8d70", fontSize: 13 },
  footer: { marginTop: 24, textAlign: "center", fontSize: 12, color: "#9a8d70" },
};
