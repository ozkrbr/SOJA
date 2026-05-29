"use client";

import { useState, useMemo, useEffect } from "react";
import { calcular } from "@/lib/calc";
import {
  INSUMOS_BAIXO_INIT,
  INSUMOS_ALTA_INIT,
  OPERACIONAL_INIT,
} from "@/lib/dados-iniciais";
import { fmtBRL, fmtNum } from "@/lib/formatters";
import type { Insumo, Operacional } from "@/lib/calc";
import ParamCard from "./ParamCard";
import PainelTab from "./tabs/PainelTab";
import InsumosTab from "./tabs/InsumosTab";
import OperacionalTab from "./tabs/OperacionalTab";
import AnaliseTab from "./tabs/AnaliseTab";
import CenariosTab from "./tabs/CenariosTab";
import type { CenarioFrontend } from "./tabs/CenariosTab";

const TABS = [
  ["painel", "Painel"],
  ["insumos", "Insumos"],
  ["operacional", "Operacional"],
  ["analise", "Análise"],
  ["cenarios", "Cenários"],
] as const;

type AbaId = (typeof TABS)[number][0];

const hoje = new Date().toISOString().slice(0, 10);

export default function CustoSojaApp() {
  const [produtividade, setProdutividade] = useState(60);
  const [precoDisp, setPrecoDisp] = useState(125);
  const [precoFuturo, setPrecoFuturo] = useState(108);
  const [barter, setBarter] = useState(false);
  const [arrendamento, setArrendamento] = useState(0);
  // parâmetros do barter corrigido (taxa em %, datas em 'YYYY-MM-DD')
  const [taxaMensal, setTaxaMensal] = useState(1.6);
  const [dataHoje, setDataHoje] = useState(hoje);
  const [dataTravamento, setDataTravamento] = useState("2027-04-30");

  const [insumosBaixo, setInsumosBaixo] = useState<Insumo[]>(() =>
    INSUMOS_BAIXO_INIT.map((i) => ({ ...i }))
  );
  const [insumosAlta, setInsumosAlta] = useState<Insumo[]>(() =>
    INSUMOS_ALTA_INIT.map((i) => ({ ...i }))
  );
  const [operacional, setOperacional] = useState<Operacional>(() => ({
    baixo: { ...OPERACIONAL_INIT.baixo },
    alta: { ...OPERACIONAL_INIT.alta },
  }));

  const [aba, setAba] = useState<AbaId>("painel");
  const [configInsumo, setConfigInsumo] = useState<"baixo" | "alta">("baixo");
  const [cenarios, setCenarios] = useState<CenarioFrontend[]>([]);
  const [nomeCenario, setNomeCenario] = useState("");
  const [loadingC, setLoadingC] = useState(true);

  const R = useMemo(
    () =>
      calcular({
        produtividade,
        precoDisp,
        precoFuturo,
        barter,
        arrendamento,
        insumosBaixo,
        insumosAlta,
        operacional,
        taxaMensal: (Number(taxaMensal) || 0) / 100,
        dataHoje,
        dataTravamento,
      }),
    [
      produtividade, precoDisp, precoFuturo, barter, arrendamento,
      insumosBaixo, insumosAlta, operacional,
      taxaMensal, dataHoje, dataTravamento,
    ]
  );

  useEffect(() => {
    fetch("/api/cenarios")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCenarios(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, []);

  async function salvarCenario() {
    const nome =
      nomeCenario.trim() || `Cenário ${new Date().toLocaleString("pt-BR")}`;
    const body = {
      nome,
      params: {
        produtividade, precoDisp, precoFuturo, barter, arrendamento,
        taxaMensal: (Number(taxaMensal) || 0) / 100,
        dataHoje,
        dataTravamento,
      },
      resumo: {
        investimentoTotal: R.investimentoTotal,
        receita: R.receita,
        lucroOperacional: R.lucroOperacional,
        margem: R.margem,
        pontoEquilibrio: R.pontoEquilibrio,
        custoPorSaca: R.custoPorSaca,
        precoSaca: R.precoSaca,
        usaAlta: R.usaAlta,
        custoBarter: R.custoBarter,
      },
    };
    try {
      const res = await fetch("/api/cenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const saved = await res.json();
        setCenarios((c) => [saved, ...c]);
        setNomeCenario("");
      }
    } catch {
      alert("Não foi possível salvar o cenário.");
    }
  }

  async function removerCenario(id: string) {
    try {
      await fetch(`/api/cenarios/${id}`, { method: "DELETE" });
    } catch {}
    setCenarios((c) => c.filter((x) => x.id !== id));
  }

  function carregarCenario(c: CenarioFrontend) {
    setProdutividade(c.params.produtividade);
    setPrecoDisp(c.params.precoDisp);
    setPrecoFuturo(c.params.precoFuturo);
    setBarter(c.params.barter);
    setArrendamento(c.params.arrendamento);
    if (c.params.taxaMensal != null) setTaxaMensal(c.params.taxaMensal * 100);
    if (c.params.dataHoje) setDataHoje(c.params.dataHoje);
    if (c.params.dataTravamento) setDataTravamento(c.params.dataTravamento);
    setAba("painel");
  }

  return (
    <div
      className="font-sans bg-brand-bg text-brand-text min-h-screen px-5 py-8"
      style={{ maxWidth: 1180, margin: "0 auto" }}
    >
      {/* Cabeçalho */}
      <header
        className="flex justify-between items-end gap-4 flex-wrap pb-4"
        style={{ borderBottom: "2px solid #d8d0bd" }}
      >
        <div>
          <div className="text-[11px] tracking-[2px] text-brand-text-muted2 font-bold">
            TERRENA AGRONEGÓCIOS
          </div>
          <h1 className="font-serif text-[30px] my-1 text-brand-text font-semibold leading-tight">
            Custo de Produção — Soja 2026
          </h1>
          <p className="m-0 text-brand-text-muted text-sm">
            Simulador de custos e rentabilidade por hectare
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-brand-brown bg-white px-3 py-2 rounded-[10px] border border-brand-border">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
            style={{ background: R.usaAlta ? "#b5882a" : "#6b8f3f" }}
          />
          Config. ativa:{" "}
          <strong>{R.usaAlta ? "Alta Produtividade" : "Baixo Custo"}</strong>
        </div>
      </header>

      {/* Parâmetros editáveis */}
      <section
        className="grid gap-3 my-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
      >
        <ParamCard
          label="PRODUTIVIDADE"
          unit="sc/ha"
          value={produtividade}
          onChange={setProdutividade}
          step={1}
          accent="#6b8f3f"
        />
        <ParamCard
          label="PREÇO DISPONÍVEL"
          sub="commodity (dia)"
          unit="R$/sc"
          value={precoDisp}
          onChange={setPrecoDisp}
          step={0.5}
          accent="#3f7d6b"
        />
        <ParamCard
          label="PREÇO FUTURO"
          sub="travamento em bolsa"
          unit="R$/sc"
          value={precoFuturo}
          onChange={setPrecoFuturo}
          step={0.5}
          accent="#b5882a"
        />
        <div
          className="bg-white border border-brand-border rounded-xl p-3 text-center shadow-sm"
          style={{ borderTop: "3px solid #a8451f" }}
        >
          <div className="text-[11px] font-bold tracking-[0.5px] text-brand-brown">
            BARTER
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5" style={{ height: 12 }}>
            troca por insumo
          </div>
          <button
            onClick={() => setBarter((b) => !b)}
            className="w-full border-none rounded-lg py-2.5 text-lg font-extrabold cursor-pointer my-2 font-serif transition-all"
            style={{
              background: barter ? "#a8451f" : "#e6e0d4",
              color: barter ? "#fff" : "#5a4632",
            }}
          >
            {barter ? "SIM" : "NÃO"}
          </button>
          <div className="text-[11px] text-brand-muted">
            {barter ? "usa preço futuro" : "usa preço disp."}
          </div>
        </div>
        <ParamCard
          label="ARRENDAMENTO"
          unit="sc/ha"
          value={arrendamento}
          onChange={setArrendamento}
          step={1}
          accent="#5a4632"
        />
      </section>

      {/* Painel de condições do barter (visível apenas quando barter=SIM) */}
      {barter && (
        <section
          className="fade rounded-xl p-4 mb-5 border-2"
          style={{ background: "#fff8f5", borderColor: "#e8c4b4" }}
        >
          <div className="flex justify-between items-center flex-wrap gap-2 mb-3">
            <strong className="text-[14px] text-brand-brown">
              Condições do barter
            </strong>
            <span className="text-[13px] font-medium" style={{ color: "#a8451f" }}>
              Custo financeiro:{" "}
              <strong>{fmtBRL(R.custoBarter)}</strong>
              {" · "}
              {fmtNum(R.meses)} meses
              {" · "}
              juros compostos
            </span>
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
          >
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-brand-brown">
                Taxa mensal (% a.m.)
              </span>
              <input
                type="number"
                step="0.01"
                value={taxaMensal}
                onChange={(e) =>
                  setTaxaMensal(e.target.value === "" ? 0 : Number(e.target.value))
                }
                className="border border-[#e0d8c5] rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-brand-brown">
                Data de hoje
              </span>
              <input
                type="date"
                value={dataHoje}
                onChange={(e) => setDataHoje(e.target.value)}
                className="border border-[#e0d8c5] rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-brand-brown">
                Data de travamento
              </span>
              <input
                type="date"
                value={dataTravamento}
                onChange={(e) => setDataTravamento(e.target.value)}
                className="border border-[#e0d8c5] rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <p className="text-[12px] text-brand-muted mt-2 mb-0">
            O custo financeiro incide sobre o investimento total (insumos + operacional) corrigido por juros compostos no período. O arrendamento é calculado sempre pelo preço disponível.
          </p>
        </section>
      )}

      {/* Tabs */}
      <nav
        className="flex gap-1 flex-wrap mb-5"
        style={{ borderBottom: "2px solid #d8d0bd" }}
      >
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className="border-none bg-transparent px-4 py-2.5 text-sm font-semibold cursor-pointer -mb-[2px] transition-colors"
            style={{
              color: aba === id ? "#2c2417" : "#8a7d5f",
              borderBottom: `3px solid ${aba === id ? "#6b8f3f" : "transparent"}`,
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Conteúdo da aba */}
      {aba === "painel" && <PainelTab R={R} produtividade={produtividade} />}

      {aba === "insumos" && (
        <InsumosTab
          R={R}
          configInsumo={configInsumo}
          setConfigInsumo={setConfigInsumo}
          insumosBaixo={insumosBaixo}
          setInsumosBaixo={setInsumosBaixo}
          insumosAlta={insumosAlta}
          setInsumosAlta={setInsumosAlta}
        />
      )}

      {aba === "operacional" && (
        <OperacionalTab
          operacional={operacional}
          setOperacional={setOperacional}
        />
      )}

      {aba === "analise" && (
        <AnaliseTab
          R={R}
          insumosBaixo={insumosBaixo}
          insumosAlta={insumosAlta}
          precoDisp={precoDisp}
          precoFuturo={precoFuturo}
          barter={barter}
          arrendamento={arrendamento}
          operacional={operacional}
          taxaMensal={(Number(taxaMensal) || 0) / 100}
          dataHoje={dataHoje}
          dataTravamento={dataTravamento}
        />
      )}

      {aba === "cenarios" && (
        <CenariosTab
          R={R}
          cenarios={cenarios}
          loadingC={loadingC}
          nomeCenario={nomeCenario}
          setNomeCenario={setNomeCenario}
          salvarCenario={salvarCenario}
          removerCenario={removerCenario}
          carregarCenario={carregarCenario}
          produtividade={produtividade}
          precoDisp={precoDisp}
          precoFuturo={precoFuturo}
          barter={barter}
          arrendamento={arrendamento}
          taxaMensal={taxaMensal}
          dataHoje={dataHoje}
          dataTravamento={dataTravamento}
        />
      )}

      <footer className="mt-6 text-center text-xs text-brand-muted">
        Modelo replicado da planilha CUSTO_SOJA_2026_CORRIGIDA · valores recalculados em
        tempo real · cenários salvos no banco de dados
      </footer>
    </div>
  );
}
