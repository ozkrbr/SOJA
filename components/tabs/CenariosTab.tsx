import { fmtBRL, fmtNum, fmtPct } from "@/lib/formatters";
import type { CalcResult } from "@/lib/calc";

export interface CenarioFrontend {
  id: string;
  nome: string;
  ts: number;
  params: {
    produtividade: number;
    precoDisp: number;
    precoFuturo: number;
    barter: boolean;
    arrendamento: number;
    taxaMensal: number;    // decimal (0.016)
    dataHoje: string | null;
    dataTravamento: string | null;
    area?: number;
  };
  resumo: {
    investimentoTotal: number;
    receita: number;
    lucroOperacional: number;
    margem: number;
    pontoEquilibrio: number;
    custoPorSaca: number;
    precoSaca: number;
    usaAlta: boolean;
    custoBarter: number;
    lucroTotalFazenda?: number;
    area?: number;
  };
}

interface CenariosTabProps {
  R: CalcResult;
  cenarios: CenarioFrontend[];
  loadingC: boolean;
  nomeCenario: string;
  setNomeCenario: (v: string) => void;
  salvarCenario: () => Promise<void>;
  removerCenario: (id: string) => Promise<void>;
  carregarCenario: (c: CenarioFrontend) => void;
  produtividade: number;
  precoDisp: number;
  precoFuturo: number;
  barter: boolean;
  arrendamento: number;
  taxaMensal: number;    // % (1.6)
  dataHoje: string;
  dataTravamento: string;
  area: number;
}

export default function CenariosTab({
  cenarios,
  loadingC,
  nomeCenario,
  setNomeCenario,
  salvarCenario,
  removerCenario,
  carregarCenario,
  produtividade,
  precoDisp,
  precoFuturo,
  barter,
  arrendamento,
  taxaMensal,
  dataHoje,
  dataTravamento,
  area,
}: CenariosTabProps) {
  return (
    <div className="fade">
      <section className="bg-white rounded-[14px] p-[18px] border border-brand-border mb-3">
        <h3 className="font-serif text-[17px] mb-3 text-brand-text font-semibold">
          Salvar cenário atual
        </h3>
        <div className="flex gap-2 flex-wrap">
          <input
            placeholder="Nome do cenário (ex.: Barter 70sc com fertilizante alto)"
            value={nomeCenario}
            onChange={(e) => setNomeCenario(e.target.value)}
            className="flex-1 min-w-[220px] border border-[#e0d8c5] rounded-[10px] px-3.5 py-2.5 text-sm"
            onKeyDown={(e) => e.key === "Enter" && salvarCenario()}
          />
          <button
            onClick={salvarCenario}
            className="border-none bg-brand-green text-white px-6 py-2.5 rounded-[10px] font-bold cursor-pointer text-sm hover:opacity-90"
          >
            Salvar
          </button>
        </div>
        <div className="flex gap-2 flex-wrap mt-3">
          {[
            `Prod: ${produtividade} sc/ha`,
            `Área: ${area} ha`,
            `Disp: ${fmtBRL(precoDisp)}`,
            `Futuro: ${fmtBRL(precoFuturo)}`,
            `Barter: ${barter ? "Sim" : "Não"}`,
            ...(barter ? [`Taxa: ${taxaMensal}% a.m.`, `Trav: ${dataTravamento}`] : []),
            `Arrend: ${arrendamento} sc/ha`,
          ].map((label) => (
            <span
              key={label}
              className="bg-brand-card-alt text-brand-brown px-3 py-1 rounded-full text-[12px] font-semibold"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-[14px] p-[18px] border border-brand-border mb-3">
        <h3 className="font-serif text-[17px] mb-3 text-brand-text font-semibold">
          Cenários salvos {cenarios.length ? `(${cenarios.length})` : ""}
        </h3>

        {loadingC && <p className="text-brand-muted text-[13px]">Carregando…</p>}
        {!loadingC && cenarios.length === 0 && (
          <p className="text-brand-muted text-[13px]">Nenhum cenário salvo ainda.</p>
        )}

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}
        >
          {cenarios.map((c) => (
            <div
              key={c.id}
              className="border border-brand-border rounded-xl p-3.5 bg-brand-card"
            >
              <div className="flex justify-between items-center mb-2.5">
                <strong className="text-sm">{c.nome}</strong>
                <span
                  className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: c.resumo.usaAlta ? "#b5882a" : "#6b8f3f" }}
                >
                  {c.resumo.usaAlta ? "Alta" : "Baixo"}
                </span>
              </div>
              <div
                className="grid gap-x-2.5 gap-y-1.5 text-[13px] text-brand-text-muted mb-3"
                style={{ gridTemplateColumns: "1fr auto" }}
              >
                <span>Lucro/ha</span>
                <strong style={{ color: c.resumo.lucroOperacional >= 0 ? "#6b8f3f" : "#a8451f" }}>
                  {fmtBRL(c.resumo.lucroOperacional)}
                </strong>
                <span>Margem</span>
                <strong>{fmtPct(c.resumo.margem)}</strong>
                <span>Custo/saca</span>
                <strong>{fmtBRL(c.resumo.custoPorSaca)}</strong>
                <span>Equilíbrio</span>
                <strong>{fmtNum(c.resumo.pontoEquilibrio)} sc</strong>
                {c.resumo.custoBarter > 0 && (
                  <>
                    <span>Custo barter</span>
                    <strong style={{ color: "#a8451f" }}>
                      {fmtBRL(c.resumo.custoBarter)}
                    </strong>
                  </>
                )}
                {c.resumo.lucroTotalFazenda != null && (
                  <>
                    <span>Total fazenda</span>
                    <strong style={{ color: c.resumo.lucroTotalFazenda >= 0 ? "#6b8f3f" : "#a8451f" }}>
                      {fmtBRL(c.resumo.lucroTotalFazenda)}
                      {c.resumo.area ? ` · ${fmtNum(c.resumo.area, 0)} ha` : ""}
                    </strong>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => carregarCenario(c)}
                  className="flex-1 border-none bg-brand-brown text-white py-2 rounded-lg cursor-pointer text-[12px] font-semibold hover:opacity-90"
                >
                  Carregar
                </button>
                <button
                  onClick={() => removerCenario(c.id)}
                  className="border border-[#d8c9b0] bg-transparent text-brand-red px-3 py-2 rounded-lg cursor-pointer text-[12px] font-semibold hover:bg-red-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>

        {cenarios.length > 1 && (
          <p className="text-brand-muted text-[13px] mt-3">
            Dica: carregue cenários diferentes para comparar lado a lado os resultados.
          </p>
        )}
      </section>
    </div>
  );
}
