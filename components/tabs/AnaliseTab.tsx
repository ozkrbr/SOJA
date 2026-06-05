import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { calcular } from "@/lib/calc";
import { fmtBRL } from "@/lib/formatters";
import type { CalcResult, Insumo, Operacional } from "@/lib/calc";

const FAM_COLORS: Record<string, string> = {
  FUNGICIDA: "#6b8f3f",
  INSETICIDA: "#a8451f",
  "BIOLÓGICO": "#3f7d6b",
  FOLIAR: "#8a9b3a",
  HERBICIDA: "#b5882a",
  FERTILIZANTE: "#5a4632",
  SEMENTE: "#7a5c2e",
  "OLEO MINERAL": "#999",
  ADJUVANTE: "#777",
  FRETE: "#555",
};
const corFam = (f: string) => FAM_COLORS[f] ?? "#888";

interface AnaliseTabProps {
  R: CalcResult;
  insumosBaixo: Insumo[];
  insumosAlta: Insumo[];
  precoDisp: number;
  precoFuturo: number;
  barter: boolean;
  arrendamento: number;
  operacional: Operacional;
  // parâmetros do barter corrigido (em decimal)
  taxaMensal: number;
  dataHoje: string;
  dataTravamento: string;
  area: number;
}

export default function AnaliseTab({
  R,
  insumosBaixo,
  insumosAlta,
  precoDisp,
  precoFuturo,
  barter,
  arrendamento,
  operacional,
  taxaMensal,
  dataHoje,
  dataTravamento,
  area,
}: AnaliseTabProps) {
  const dadosCusto = useMemo(() => {
    const lista = R.usaAlta ? insumosAlta : insumosBaixo;
    const map: Record<string, number> = {};
    lista.forEach((i) => {
      const t = (Number(i.quantidade) || 0) * (Number(i.valor) || 0);
      map[i.familia] = (map[i.familia] || 0) + t;
    });
    return Object.entries(map)
      .map(([familia, valor]) => ({ familia, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [R.usaAlta, insumosAlta, insumosBaixo]);

  const dadosSensibilidade = useMemo(() => {
    const out = [];
    for (let p = 40; p <= 90; p += 5) {
      const c = calcular({
        produtividade: p,
        precoDisp,
        precoFuturo,
        barter,
        arrendamento,
        insumosBaixo,
        insumosAlta,
        operacional,
        taxaMensal,
        dataHoje,
        dataTravamento,
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
    <div className="fade">
      <section className="bg-white rounded-[14px] p-[18px] border border-brand-border mb-3">
        <h3 className="font-serif text-[17px] mb-3 text-brand-text font-semibold">
          Composição do custo de insumos por família —{" "}
          {R.usaAlta ? "Alta Produtividade" : "Baixo Custo"}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosCusto} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d4" />
            <XAxis
              type="number"
              tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`}
              tick={{ fontSize: 11 }}
            />
            <YAxis type="category" dataKey="familia" width={95} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmtBRL(v)} />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
              {dadosCusto.map((d, i) => (
                <Cell key={i} fill={corFam(d.familia)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="bg-white rounded-[14px] p-[18px] border border-brand-border mb-3">
        <h3 className="font-serif text-[17px] mb-1 text-brand-text font-semibold">
          Sensibilidade à produtividade
        </h3>
        <p className="text-[13px] text-brand-text-muted mb-2">
          Lucro operacional (R$/ha) e custo por saca conforme a produtividade muda. A linha em{" "}
          <strong>60 sc/ha</strong> marca a transição automática de configuração.
          {barter && " Inclui custo financeiro do barter."}
        </p>
        <div className="flex gap-4 flex-wrap mb-2">
          <span className="flex items-center gap-1.5 text-[12px] text-brand-brown">
            <span className="inline-block w-4 h-3 rounded-sm border border-[#e0d8c5]" style={{ background: "rgba(107,143,63,.14)" }} />
            Zona Baixo Custo (≤ 60 sc/ha)
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-brand-brown">
            <span className="inline-block w-4 h-3 rounded-sm border border-[#e0d8c5]" style={{ background: "rgba(181,136,42,.16)" }} />
            Zona Alta Produtividade (&gt; 60 sc/ha)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={dadosSensibilidade} margin={{ left: 10, right: 10, top: 10 }}>
            <ReferenceArea x1={40} x2={60} yAxisId="l" fill="#6b8f3f" fillOpacity={0.08} />
            <ReferenceArea x1={60} x2={90} yAxisId="l" fill="#b5882a" fillOpacity={0.1} />
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e0d4" />
            <XAxis
              dataKey="prod"
              tick={{ fontSize: 11 }}
              label={{ value: "sc/ha", position: "insideBottomRight", offset: -4, fontSize: 11 }}
            />
            <YAxis
              yAxisId="l"
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
            />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) => fmtBRL(v)}
              labelFormatter={(p) => {
                const pt = dadosSensibilidade.find((d) => d.prod === p);
                return `${p} sc/ha · ${pt?.config === "alta" ? "Alta Produtividade" : "Baixo Custo"}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine yAxisId="l" y={0} stroke="#a8451f" strokeDasharray="4 4" />
            <ReferenceLine
              yAxisId="l"
              x={60}
              stroke="#5a4632"
              strokeWidth={2}
              label={{ value: "transição de configuração", position: "top", fontSize: 11, fill: "#5a4632" }}
            />
            <Bar yAxisId="l" dataKey="lucro" name="Lucro op. (R$/ha)" radius={[3, 3, 0, 0]}>
              {dadosSensibilidade.map((d, i) => (
                <Cell key={i} fill={d.lucro >= 0 ? (d.config === "alta" ? "#b5882a" : "#6b8f3f") : "#a8451f"} />
              ))}
            </Bar>
            <Line
              yAxisId="r"
              dataKey="custoSc"
              name="Custo/saca (R$)"
              stroke="#5a4632"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[13px] text-brand-text-muted mt-1.5 mb-0">
          Até 60 sc/ha o modelo usa a cesta de insumos <strong>Baixo Custo</strong> (barras verdes);
          acima de 60, salta para <strong>Alta Produtividade</strong> (barras âmbar), com insumos e
          custo operacional maiores. O degrau no gráfico mostra esse salto de investimento.
        </p>
      </section>
    </div>
  );
}
