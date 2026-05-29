import Kpi from "@/components/Kpi";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/formatters";
import type { CalcResult } from "@/lib/calc";

interface PainelTabProps {
  R: CalcResult;
  produtividade: number;
}

export default function PainelTab({ R, produtividade }: PainelTabProps) {
  const pctEquil = Math.min(100, (R.pontoEquilibrio / produtividade) * 100);

  return (
    <div className="fade">
      {/* Linha 1: métricas principais */}
      <section className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi
          big
          title="Receita Bruta"
          value={fmtBRL(R.receita)}
          sub={`${produtividade} sc × ${fmtBRL(R.precoSaca)}`}
          accent="#3f7d6b"
        />
        <Kpi
          big
          title="Investimento Total"
          value={fmtBRL(R.investimentoTotal)}
          sub={`Insumos ${fmtBRL(R.insumos)} + Op. ${fmtBRL(R.opVal)}`}
          accent="#5a4632"
        />
        <Kpi
          big
          title="Lucro Operacional"
          value={fmtBRL(R.lucroOperacional)}
          sub={`Margem ${fmtPct(R.margem)}`}
          accent={R.lucroOperacional >= 0 ? "#6b8f3f" : "#a8451f"}
        />
      </section>

      {/* Linha 2: custo total com decomposição */}
      <section className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi
          big
          title="Custo Total"
          value={fmtBRL(R.custoTotal)}
          sub={`Invest. ${fmtBRL(R.investimentoTotal)} + Barter ${fmtBRL(R.custoBarter)} + Arrend. ${fmtBRL(R.custoArrend)}`}
          accent="#a8451f"
        />
      </section>

      {/* Linha 3: KPIs secundários */}
      <section className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi title="Margem Operacional" value={fmtPct(R.margem)} accent="#b5882a" />
        <Kpi
          title="Ponto de Equilíbrio"
          value={`${fmtNum(R.pontoEquilibrio)} sc/ha`}
          sub={`de ${produtividade} sc/ha`}
          accent="#a8451f"
        />
        <Kpi
          title="Custo por Saca"
          value={fmtBRL(R.custoPorSaca)}
          sub={`venda a ${fmtBRL(R.precoSaca)}`}
          accent="#5a4632"
        />
        <Kpi
          title="Ganho por Saca"
          value={fmtBRL(R.precoSaca - R.custoPorSaca)}
          accent={R.precoSaca - R.custoPorSaca >= 0 ? "#6b8f3f" : "#a8451f"}
        />
      </section>

      {/* Barra de equilíbrio */}
      <section className="bg-white rounded-[14px] p-[18px] border border-brand-border mb-3">
        <h3 className="font-serif text-[17px] mb-3 text-brand-text font-semibold">
          Margem de segurança
        </h3>
        <div
          className="relative h-[26px] rounded-md overflow-hidden"
          style={{ background: "linear-gradient(90deg,#e8eddc,#d9e4c4)" }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 opacity-85"
            style={{
              width: `${pctEquil}%`,
              background: "linear-gradient(90deg,#c97f4a,#a8451f)",
            }}
          />
          <div
            className="absolute top-[-4px] bottom-[-4px] w-[3px] bg-brand-text"
            style={{ left: `${pctEquil}%` }}
          />
        </div>
        <div className="flex justify-between text-[13px] text-brand-brown mt-2">
          <span>
            Equilíbrio: <strong>{fmtNum(R.pontoEquilibrio)} sc/ha</strong>
          </span>
          <span>
            Meta: <strong>{produtividade} sc/ha</strong>
          </span>
        </div>
        <p className="text-[13px] text-brand-text-muted mt-1.5 mb-0">
          {R.pontoEquilibrio < produtividade
            ? `Acima do equilíbrio por ${fmtNum(produtividade - R.pontoEquilibrio)} sc/ha — sobra de segurança.`
            : "Atenção: o equilíbrio está acima da produtividade esperada."}
        </p>
      </section>
    </div>
  );
}
