import { somaOperacional } from "@/lib/calc";
import { fmtBRL } from "@/lib/formatters";
import type { Operacional } from "@/lib/calc";

interface OperacionalTabProps {
  operacional: Operacional;
  setOperacional: React.Dispatch<React.SetStateAction<Operacional>>;
}

const LINHAS = [
  ["plantio", "Plantio"],
  ["colheita", "Colheita"],
  ["manutencao", "Manutenção"],
  ["outros", "Outros (ADM)"],
] as const;

export default function OperacionalTab({
  operacional,
  setOperacional,
}: OperacionalTabProps) {
  function upd(config: "baixo" | "alta", campo: string, v: number) {
    setOperacional((o) => ({
      ...o,
      [config]: { ...o[config], [campo]: v },
    }));
  }

  return (
    <div className="fade bg-white rounded-[14px] p-[18px] border border-brand-border mb-3">
      <h3 className="font-serif text-[17px] mb-3 text-brand-text font-semibold">
        Custos operacionais (R$/ha)
      </h3>
      <div
        className="grid gap-2 items-center"
        style={{ gridTemplateColumns: "1fr 130px 130px", maxWidth: 520 }}
      >
        <div />
        <div className="text-[12px] font-bold text-brand-brown text-center">Baixo Custo</div>
        <div className="text-[12px] font-bold text-brand-brown text-center">Alta Produt.</div>

        {LINHAS.map(([k, label]) => (
          <>
            <div key={`lbl-${k}`} className="text-sm text-[#3c3526]">
              {label}
            </div>
            <input
              key={`baixo-${k}`}
              type="number"
              className="border border-[#e0d8c5] rounded-lg px-2.5 py-2 text-sm text-right"
              value={operacional.baixo[k]}
              onChange={(e) => upd("baixo", k, Number(e.target.value))}
            />
            <input
              key={`alta-${k}`}
              type="number"
              className="border border-[#e0d8c5] rounded-lg px-2.5 py-2 text-sm text-right"
              value={operacional.alta[k]}
              onChange={(e) => upd("alta", k, Number(e.target.value))}
            />
          </>
        ))}

        <div className="text-sm font-bold text-[#3c3526]">Subtotal</div>
        <div className="text-right font-bold text-brand-brown font-serif text-base px-2.5 py-1.5">
          {fmtBRL(somaOperacional(operacional.baixo))}
        </div>
        <div className="text-right font-bold text-brand-brown font-serif text-base px-2.5 py-1.5">
          {fmtBRL(somaOperacional(operacional.alta))}
        </div>
      </div>
    </div>
  );
}
