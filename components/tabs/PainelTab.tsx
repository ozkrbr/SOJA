import Kpi from "@/components/Kpi";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/formatters";
import type { CalcResult } from "@/lib/calc";

interface PainelTabProps {
  R: CalcResult;
  produtividade: number;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-[1px] uppercase text-brand-text-muted2 mx-0.5 mb-2 mt-1">
      {children}
    </p>
  );
}

function CostCard({
  title,
  rows,
  total,
  accent,
}: {
  title: string;
  rows: { label: string; value: string }[];
  total: string;
  accent: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-brand-border p-4"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="text-[12px] text-brand-muted2 font-semibold uppercase tracking-[0.5px] mb-3">
        {title}
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-baseline text-[13px]">
            <span className="text-brand-text-muted">{r.label}</span>
            <span className="text-brand-brown font-medium tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-brand-border">
        <span className="text-brand-text text-[12px] font-bold uppercase tracking-wide">Total</span>
        <span className="text-brand-text font-bold font-serif text-[20px] tabular-nums">{total}</span>
      </div>
    </div>
  );
}

export default function PainelTab({ R, produtividade }: PainelTabProps) {
  const pctEquil = Math.min(100, (R.pontoEquilibrio / produtividade) * 100);

  return (
    <div className="fade">
      {/* ── 1. Receita ───────────────────────────────────────────── */}
      <SectionLabel>Por hectare</SectionLabel>
      <section className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi
          big
          title="Receita Bruta"
          value={fmtBRL(R.receita)}
          sub={`${produtividade} sc × ${fmtBRL(R.precoSaca)}`}
          accent="#3f7d6b"
        />
      </section>

      {/* ── 2. Decomposição do custo ─────────────────────────────── */}
      <SectionLabel>Composição do custo</SectionLabel>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <CostCard
          title="Investimento (R$/ha)"
          rows={[
            { label: R.custosTravados ? "Insumos (travado)" : "Insumos", value: fmtBRL(R.insumos) },
            { label: "Operacional", value: fmtBRL(R.opVal) },
          ]}
          total={fmtBRL(R.investimentoTotal)}
          accent="#5a4632"
        />
        <CostCard
          title="Barter + Arrendamento (R$/ha)"
          rows={[
            { label: "Custo financeiro (barter)", value: fmtBRL(R.custoBarter) },
            { label: "Arrend. / Func. / Terra", value: fmtBRL(R.custoArrend) },
          ]}
          total={fmtBRL(R.custoBarter + R.custoArrend)}
          accent="#b5882a"
        />
      </div>

      {/* ── 3. Resultado ─────────────────────────────────────────── */}
      <SectionLabel>Resultado</SectionLabel>
      <section className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi
          big
          title="Custo Total"
          value={fmtBRL(R.custoTotal)}
          sub={`Invest. ${fmtBRL(R.investimentoTotal)} + Fin. ${fmtBRL(R.custoBarter + R.custoArrend)}`}
          accent="#a8451f"
        />
        <Kpi
          big
          title={R.lucroOperacional >= 0 ? "Lucro Operacional" : "Prejuízo Operacional"}
          value={fmtBRL(R.lucroOperacional)}
          sub={`Margem ${fmtPct(R.margem)}`}
          accent={R.lucroOperacional >= 0 ? "#6b8f3f" : "#a8451f"}
        />
      </section>

      {/* ── 4. Indicadores ───────────────────────────────────────── */}
      <SectionLabel>Indicadores</SectionLabel>
      <section className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <Kpi title="Margem Operacional" value={fmtPct(R.margem)} accent="#b5882a" />
        <Kpi
          title="Ponto de Equilíbrio"
          value={`${fmtNum(R.pontoEquilibrio)} sc/ha`}
          sub={`meta: ${produtividade} sc/ha`}
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

      {/* ── 5. Barra de segurança ────────────────────────────────── */}
      <section className="bg-white rounded-xl p-[18px] border border-brand-border mb-4" style={{ borderLeft: "4px solid #a8451f" }}>
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
          <span>Equilíbrio: <strong>{fmtNum(R.pontoEquilibrio)} sc/ha</strong></span>
          <span>Meta: <strong>{produtividade} sc/ha</strong></span>
        </div>
        <p className="text-[13px] text-brand-text-muted mt-1.5 mb-0">
          {R.pontoEquilibrio < produtividade
            ? `Acima do equilíbrio por ${fmtNum(produtividade - R.pontoEquilibrio)} sc/ha — margem de segurança.`
            : "Atenção: o equilíbrio está acima da produtividade esperada."}
        </p>
      </section>

      {/* ── 6. Totais da fazenda ─────────────────────────────────── */}
      <SectionLabel>Total da fazenda — {fmtNum(R.area, 0)} ha</SectionLabel>
      <section className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <Kpi
          big
          title="Receita Total"
          value={fmtBRL(R.receitaTotalFazenda)}
          sub={`${fmtNum(R.producaoTotalFazenda, 0)} sacas`}
          accent="#3f7d6b"
        />
        <Kpi
          big
          title="Custo Total"
          value={fmtBRL(R.custoTotalFazenda)}
          sub={`Investimento ${fmtBRL(R.investimentoTotalFazenda)}`}
          accent="#5a4632"
        />
        <Kpi
          big
          title={R.lucroTotalFazenda >= 0 ? "Lucro Total" : "Prejuízo Total"}
          value={fmtBRL(R.lucroTotalFazenda)}
          sub={`${fmtNum(R.area, 0)} ha × ${fmtBRL(R.lucroOperacional)}/ha`}
          accent={R.lucroTotalFazenda >= 0 ? "#6b8f3f" : "#a8451f"}
        />
      </section>
    </div>
  );
}
