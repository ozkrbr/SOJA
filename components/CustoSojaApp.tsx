"use client";

import { useState, useMemo, useEffect, useReducer, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { calcular } from "@/lib/calc";
import { authFetch } from "@/lib/api-client";
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

// ─── Estado dos parâmetros (agrupado em um único objeto via useReducer) ───────
// taxaMensal é mantido em % (ex.: 1.6) para a UI; convertido para fração no cálculo.
interface Params {
  produtividade: number;
  precoDisp: number;
  precoFuturo: number;
  barter: boolean;
  arrendamento: number;
  area: number;
  taxaMensal: number;
  dataHoje: string;
  dataTravamento: string;
}

const PARAMS_INIT: Params = {
  produtividade: 60,
  precoDisp: 125,
  precoFuturo: 108,
  barter: false,
  arrendamento: 0,
  area: 400,
  taxaMensal: 1.6,
  dataHoje: hoje,
  dataTravamento: "2027-04-30",
};

type ParamsAction =
  | { type: "set"; key: keyof Params; value: Params[keyof Params] }
  | { type: "load"; params: Partial<Params> };

function paramsReducer(state: Params, action: ParamsAction): Params {
  switch (action.type) {
    case "set":
      return { ...state, [action.key]: action.value };
    case "load":
      // Carrega um cenário salvo num único passo — impossível "esquecer" um campo.
      return { ...state, ...action.params };
    default:
      return state;
  }
}

export default function CustoSojaApp() {
  const { instance, accounts } = useMsal();
  const user = accounts[0];

  const [params, dispatch] = useReducer(paramsReducer, PARAMS_INIT);
  const {
    produtividade, precoDisp, precoFuturo, barter,
    arrendamento, area, taxaMensal, dataHoje, dataTravamento,
  } = params;

  // Setter tipado para qualquer campo (substitui os 9 useState soltos).
  const set = useCallback(
    <K extends keyof Params>(key: K) =>
      (value: Params[K]) => dispatch({ type: "set", key, value }),
    []
  );

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

  const faixaInvalida = produtividade < 60 || produtividade > 90;

  // Trava de custos (Alta Produtividade): congela a posição de sc/ha usada
  // na interpolação de insumos no momento em que foi ativada — os insumos
  // continuam recalculados a partir das tabelas (editar preço/qtde reflete),
  // só o crescimento por aumento de produtividade fica congelado.
  const [custosBloqueados, setCustosBloqueados] = useState(false);
  const [produtividadeTravada, setProdutividadeTravada] = useState<number | null>(null);

  const [aba, setAba] = useState<AbaId>("painel");
  const [configInsumo, setConfigInsumo] = useState<"baixo" | "alta">("baixo");
  const [cenarios, setCenarios] = useState<CenarioFrontend[]>([]);
  const [nomeCenario, setNomeCenario] = useState("");
  const [loadingC, setLoadingC] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  // Feedback ao usuário (sucesso/erro) das operações de API.
  const [status, setStatus] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const notificar = useCallback((tipo: "ok" | "erro", texto: string) => {
    setStatus({ tipo, texto });
    window.setTimeout(() => setStatus(null), 4000);
  }, []);

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
        area,
        produtividadeTravada: custosBloqueados ? produtividadeTravada : null,
      }),
    [
      produtividade, precoDisp, precoFuturo, barter, arrendamento, area,
      insumosBaixo, insumosAlta, operacional,
      taxaMensal, dataHoje, dataTravamento,
      custosBloqueados, produtividadeTravada,
    ]
  );

  // barter ligado mas sem período válido (datas vazias/invertidas) → custo zero silencioso.
  const barterSemPeriodo = barter && R.meses <= 0;

  // Sai da Alta Produtividade (sc/ha <= 60) → destrava automaticamente.
  useEffect(() => {
    if (!R.usaAlta && custosBloqueados) {
      setCustosBloqueados(false);
      setProdutividadeTravada(null);
    }
  }, [R.usaAlta, custosBloqueados]);

  const alternarTravarCustos = useCallback(() => {
    setCustosBloqueados((prev) => {
      if (!prev) {
        setProdutividadeTravada(produtividade);
      } else {
        setProdutividadeTravada(null);
      }
      return !prev;
    });
  }, [produtividade]);

  useEffect(() => {
    if (!user) return;
    setLoadingC(true);
    authFetch(instance, user, "/api/cenarios")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCenarios(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, [instance, user]);

  async function salvarCenario() {
    if (salvando) return;
    const nome =
      nomeCenario.trim() || `Cenário ${new Date().toLocaleString("pt-BR")}`;
    const body = {
      nome,
      params: {
        produtividade, precoDisp, precoFuturo, barter, arrendamento,
        taxaMensal: (Number(taxaMensal) || 0) / 100,
        dataHoje,
        dataTravamento,
        area,
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
        lucroTotalFazenda: R.lucroTotalFazenda,
        area: R.area,
      },
    };
    setSalvando(true);
    try {
      const res = await authFetch(instance, user, "/api/cenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const saved = await res.json();
        setCenarios((c) => [saved, ...c]);
        setNomeCenario("");
        notificar("ok", "Cenário salvo com sucesso.");
      } else if (res.status === 401) {
        notificar("erro", "Sessão expirada — faça login novamente.");
      } else {
        notificar("erro", "Não foi possível salvar o cenário.");
      }
    } catch {
      notificar("erro", "Falha de conexão ao salvar o cenário.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerCenario(id: string) {
    if (removendoId) return;
    if (!window.confirm("Excluir este cenário? Esta ação não pode ser desfeita.")) {
      return;
    }
    setRemovendoId(id);
    try {
      const res = await authFetch(instance, user, `/api/cenarios/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCenarios((c) => c.filter((x) => x.id !== id));
        notificar("ok", "Cenário excluído.");
      } else {
        notificar("erro", "Não foi possível excluir o cenário.");
      }
    } catch {
      notificar("erro", "Falha de conexão ao excluir o cenário.");
    } finally {
      setRemovendoId(null);
    }
  }

  function carregarCenario(c: CenarioFrontend) {
    // Um único dispatch restaura todos os parâmetros (taxaMensal volta para %).
    dispatch({
      type: "load",
      params: {
        produtividade: c.params.produtividade,
        precoDisp: c.params.precoDisp,
        precoFuturo: c.params.precoFuturo,
        barter: c.params.barter,
        arrendamento: c.params.arrendamento,
        ...(c.params.taxaMensal != null ? { taxaMensal: c.params.taxaMensal * 100 } : {}),
        ...(c.params.dataHoje ? { dataHoje: c.params.dataHoje } : {}),
        ...(c.params.dataTravamento ? { dataTravamento: c.params.dataTravamento } : {}),
        ...(c.params.area != null ? { area: c.params.area } : {}),
      },
    });
    setAba("painel");
  }

  // ─── Exportação CSV (valores em precisão cheia, não os arredondados da tela) ──
  const exportarCSV = useCallback(() => {
    const linhas: [string, string | number][] = [
      ["Parâmetro", "Valor"],
      ["Produtividade (sc/ha)", produtividade],
      ["Área plantio (ha)", area],
      ["Preço disponível (R$/sc)", precoDisp],
      ["Preço futuro (R$/sc)", precoFuturo],
      ["Barter", barter ? "Sim" : "Não"],
      ["Taxa mensal (% a.m.)", taxaMensal],
      ["Data hoje", dataHoje],
      ["Data travamento", dataTravamento],
      ["Arrendamento (sc/ha)", arrendamento],
      ["", ""],
      ["Resultado", "Valor"],
      ["Config ativa", R.usaAlta ? "Alta Produtividade" : "Baixo Custo"],
      ["Insumos (R$/ha)", R.insumos],
      ["Operacional (R$/ha)", R.opVal],
      ["Investimento total (R$/ha)", R.investimentoTotal],
      ["Preço saca (R$/sc)", R.precoSaca],
      ["Receita (R$/ha)", R.receita],
      ["Meses (barter)", R.meses],
      ["Custo barter (R$/ha)", R.custoBarter],
      ["Custo arrendamento (R$/ha)", R.custoArrend],
      ["Custo total (R$/ha)", R.custoTotal],
      ["Lucro operacional (R$/ha)", R.lucroOperacional],
      ["Margem", R.margem],
      ["Ponto de equilíbrio (sc/ha)", R.pontoEquilibrio],
      ["Custo por saca (R$/sc)", R.custoPorSaca],
      ["", ""],
      ["Totais da fazenda", "Valor"],
      ["Receita total (R$)", R.receitaTotalFazenda],
      ["Custo total (R$)", R.custoTotalFazenda],
      ["Investimento total (R$)", R.investimentoTotalFazenda],
      ["Lucro total (R$)", R.lucroTotalFazenda],
      ["Produção total (sc)", R.producaoTotalFazenda],
    ];
    const csv = linhas
      .map(([k, v]) =>
        [k, v].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")
      )
      .join("\r\n");
    // BOM para o Excel reconhecer UTF-8 (acentos).
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custo-soja-${produtividade}sc-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    produtividade, area, precoDisp, precoFuturo, barter, taxaMensal,
    dataHoje, dataTravamento, arrendamento, R,
  ]);

  return (
    <div
      className="font-sans bg-brand-bg text-brand-text min-h-screen px-5 py-8"
      style={{ maxWidth: 1180, margin: "0 auto" }}
    >
      {/* Toast de feedback */}
      {status && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{
            background: status.tipo === "ok" ? "#eaf3e0" : "#fbe9e4",
            color: status.tipo === "ok" ? "#3c5a1f" : "#a8451f",
            border: `1px solid ${status.tipo === "ok" ? "#bcd99a" : "#e8b4a4"}`,
          }}
        >
          {status.texto}
        </div>
      )}

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
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={exportarCSV}
            className="text-[13px] text-brand-brown bg-white px-3 py-2 rounded-[10px] border border-brand-border hover:bg-brand-card-alt cursor-pointer"
            title="Exportar parâmetros e resultados em CSV (abre no Excel)"
          >
            Exportar CSV
          </button>
          <div className="flex items-center gap-2 text-[13px] text-brand-brown bg-white px-3 py-2 rounded-[10px] border border-brand-border">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
              style={{ background: R.usaAlta ? "#b5882a" : "#6b8f3f" }}
            />
            Config. ativa:{" "}
            <strong>{R.usaAlta ? "Alta Produtividade" : "Baixo Custo"}</strong>
          </div>
          {user && (
            <div className="flex items-center gap-2 text-[13px] text-brand-text-muted bg-white px-3 py-2 rounded-[10px] border border-brand-border">
              <span className="truncate max-w-[160px]" title={user.username}>
                {user.name ?? user.username}
              </span>
              <button
                onClick={() => void instance.logoutRedirect({ postLogoutRedirectUri: "/login" })}
                className="text-[12px] text-red-600 hover:underline leading-none"
              >
                Sair
              </button>
            </div>
          )}
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
          onChange={set("produtividade")}
          step={1}
          accent="#6b8f3f"
        />
        {R.usaAlta && (
          <div
            className="bg-white border border-brand-border rounded-xl p-3 text-center shadow-sm"
            style={{ borderTop: "3px solid #b5882a" }}
          >
            <div className="text-[11px] font-bold tracking-[0.5px] text-brand-brown">
              TRAVAR CUSTOS
            </div>
            <div className="text-[10px] text-brand-muted mt-0.5" style={{ height: 12 }}>
              insumos não sobem c/ sc/ha
            </div>
            <button
              onClick={alternarTravarCustos}
              className="w-full border-none rounded-lg py-2.5 text-lg font-extrabold cursor-pointer my-2 font-serif transition-all"
              style={{
                background: custosBloqueados ? "#b5882a" : "#e6e0d4",
                color: custosBloqueados ? "#fff" : "#5a4632",
              }}
            >
              {custosBloqueados ? "SIM" : "NÃO"}
            </button>
            <div className="text-[11px] text-brand-muted">
              {custosBloqueados
                ? `travado em ${fmtNum(produtividadeTravada ?? 0)} sc/ha`
                : "custo de insumos livre"}
            </div>
          </div>
        )}
        <ParamCard
          label="ÁREA PLANTIO"
          unit="ha"
          value={area}
          onChange={set("area")}
          step={10}
          accent="#7a5c2e"
        />
        <ParamCard
          label="PREÇO DISPONÍVEL"
          sub="commodity (dia)"
          unit="R$/sc"
          value={precoDisp}
          onChange={set("precoDisp")}
          step={0.5}
          accent="#3f7d6b"
        />
        <ParamCard
          label="PREÇO FUTURO"
          sub="travamento em bolsa"
          unit="R$/sc"
          value={precoFuturo}
          onChange={set("precoFuturo")}
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
            onClick={() => set("barter")(!barter)}
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
          onChange={set("arrendamento")}
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
          {barterSemPeriodo && (
            <div
              className="mb-3 text-[12px] font-semibold px-3 py-2 rounded-lg"
              style={{ background: "#fdf3d6", color: "#8a6d1f", border: "1px solid #e8d49a" }}
            >
              ⚠ Período inválido: a data de travamento deve ser posterior à data de
              hoje — sem isso o custo financeiro do barter fica zerado.
            </div>
          )}
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
                  set("taxaMensal")(e.target.value === "" ? 0 : Number(e.target.value))
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
                onChange={(e) => set("dataHoje")(e.target.value)}
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
                onChange={(e) => set("dataTravamento")(e.target.value)}
                className="border border-[#e0d8c5] rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <p className="text-[12px] text-brand-muted mt-2 mb-0">
            O custo financeiro incide sobre o investimento total (insumos + operacional) corrigido por juros compostos no período. O arrendamento é calculado sempre pelo preço disponível.
          </p>
        </section>
      )}

      {/* Tabs — ocultas fora do intervalo válido */}
      {!faixaInvalida && (
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
      )}

      {/* Alerta fora do intervalo válido */}
      {faixaInvalida ? (
        <div className="fade flex flex-col items-center justify-center py-16 gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#b5882a"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-14 h-14"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-[15px] font-semibold text-brand-brown text-center">
            Não disponível — selecione entre <strong>60</strong> e <strong>90 sc/ha</strong>.
          </p>
        </div>
      ) : (
        <>
          {aba === "painel" && (
            <PainelTab R={R} produtividade={produtividade} />
          )}

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
              area={area}
            />
          )}

          {aba === "cenarios" && (
            <CenariosTab
              R={R}
              cenarios={cenarios}
              loadingC={loadingC}
              salvando={salvando}
              removendoId={removendoId}
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
              area={area}
            />
          )}
        </>
      )}

      <footer className="mt-6 text-center text-xs text-brand-muted">
        Modelo replicado da planilha CUSTO_SOJA_2026_CORRIGIDA · valores recalculados em
        tempo real · cenários salvos no banco de dados
      </footer>
    </div>
  );
}
