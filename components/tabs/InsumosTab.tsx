import TabelaInsumos from "@/components/TabelaInsumos";
import { fmtBRL } from "@/lib/formatters";
import type { CalcResult, Insumo } from "@/lib/calc";

interface InsumosTabProps {
  R: CalcResult;
  configInsumo: "baixo" | "alta";
  setConfigInsumo: (v: "baixo" | "alta") => void;
  insumosBaixo: Insumo[];
  setInsumosBaixo: React.Dispatch<React.SetStateAction<Insumo[]>>;
  insumosAlta: Insumo[];
  setInsumosAlta: React.Dispatch<React.SetStateAction<Insumo[]>>;
}

export default function InsumosTab({
  R,
  configInsumo,
  setConfigInsumo,
  insumosBaixo,
  setInsumosBaixo,
  insumosAlta,
  setInsumosAlta,
}: InsumosTabProps) {
  return (
    <div className="fade">
      <div className="flex gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setConfigInsumo("baixo")}
          className="border px-4 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-colors"
          style={
            configInsumo === "baixo"
              ? { background: "#5a4632", color: "#fff", borderColor: "#5a4632" }
              : { background: "#fff", color: "#8a7d5f", borderColor: "#e0d8c5" }
          }
        >
          Baixo Custo · {fmtBRL(R.subBaixo)}
        </button>
        <button
          onClick={() => setConfigInsumo("alta")}
          className="border px-4 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-colors"
          style={
            configInsumo === "alta"
              ? { background: "#5a4632", color: "#fff", borderColor: "#5a4632" }
              : { background: "#fff", color: "#8a7d5f", borderColor: "#e0d8c5" }
          }
        >
          Alta Produtividade · {fmtBRL(R.subAlta)}
        </button>
      </div>
      <TabelaInsumos
        lista={configInsumo === "baixo" ? insumosBaixo : insumosAlta}
        setLista={configInsumo === "baixo" ? setInsumosBaixo : setInsumosAlta}
      />
    </div>
  );
}
