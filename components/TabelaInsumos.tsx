import { subtotalInsumos } from "@/lib/calc";
import { fmtBRL } from "@/lib/formatters";
import type { Insumo } from "@/lib/calc";

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

interface TabelaInsumosProps {
  lista: Insumo[];
  setLista: React.Dispatch<React.SetStateAction<Insumo[]>>;
}

export default function TabelaInsumos({ lista, setLista }: TabelaInsumosProps) {
  const total = subtotalInsumos(lista);

  function upd(i: number, campo: keyof Insumo, v: string) {
    setLista((l) =>
      l.map((it, idx) =>
        idx === i
          ? {
              ...it,
              [campo]:
                campo === "produto" || campo === "familia"
                  ? v
                  : v === ""
                  ? 0
                  : Number(v),
            }
          : it
      )
    );
  }

  function remover(i: number) {
    setLista((l) => l.filter((_, idx) => idx !== i));
  }

  function adicionar() {
    setLista((l) => [
      ...l,
      { produto: "Novo insumo", quantidade: 0, familia: "FOLIAR", valor: 0 },
    ]);
  }

  return (
    <div className="bg-white rounded-[14px] p-[18px] border border-brand-border mb-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]" style={{ minWidth: 640 }}>
          <thead>
            <tr>
              <th className="text-left px-2.5 py-2 text-[11px] uppercase tracking-[0.5px] text-brand-muted2 border-b-2 border-brand-border">
                Produto
              </th>
              <th className="text-center px-2.5 py-2 text-[11px] uppercase tracking-[0.5px] text-brand-muted2 border-b-2 border-brand-border">
                Família
              </th>
              <th className="text-right px-2.5 py-2 text-[11px] uppercase tracking-[0.5px] text-brand-muted2 border-b-2 border-brand-border">
                Qtde
              </th>
              <th className="text-right px-2.5 py-2 text-[11px] uppercase tracking-[0.5px] text-brand-muted2 border-b-2 border-brand-border">
                Valor (R$)
              </th>
              <th className="text-right px-2.5 py-2 text-[11px] uppercase tracking-[0.5px] text-brand-muted2 border-b-2 border-brand-border">
                Total (R$/ha)
              </th>
              <th className="border-b-2 border-brand-border" />
            </tr>
          </thead>
          <tbody>
            {lista.map((it, i) => (
              <tr key={i} className={i % 2 ? "bg-brand-card" : undefined}>
                <td className="px-2.5 py-1 border-b border-brand-card-alt">
                  <input
                    className="w-full border border-transparent bg-transparent px-1.5 py-1.5 text-[13px] rounded-md hover:border-brand-border focus:border-brand-green"
                    value={it.produto}
                    onChange={(e) => upd(i, "produto", e.target.value)}
                  />
                </td>
                <td className="px-2.5 py-1 border-b border-brand-card-alt text-center">
                  <span
                    className="inline-block text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-[0.3px]"
                    style={{ background: corFam(it.familia) }}
                  >
                    {it.familia}
                  </span>
                </td>
                <td className="px-2.5 py-1 border-b border-brand-card-alt">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-transparent bg-transparent px-1.5 py-1.5 text-[13px] rounded-md text-right hover:border-brand-border focus:border-brand-green"
                    value={it.quantidade}
                    onChange={(e) => upd(i, "quantidade", e.target.value)}
                  />
                </td>
                <td className="px-2.5 py-1 border-b border-brand-card-alt">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-transparent bg-transparent px-1.5 py-1.5 text-[13px] rounded-md text-right hover:border-brand-border focus:border-brand-green"
                    value={it.valor}
                    onChange={(e) => upd(i, "valor", e.target.value)}
                  />
                </td>
                <td className="px-2.5 py-1 border-b border-brand-card-alt text-right font-semibold whitespace-nowrap">
                  {fmtBRL((it.quantidade || 0) * (it.valor || 0))}
                </td>
                <td className="px-2.5 py-1 border-b border-brand-card-alt text-center">
                  <button
                    onClick={() => remover(i)}
                    className="border-none bg-brand-card-alt text-brand-red w-6 h-6 rounded-md cursor-pointer text-base leading-none hover:bg-red-100"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={4}
                className="px-2.5 py-2 font-bold border-t-2 border-brand-brown"
              >
                SUBTOTAL INSUMOS
              </td>
              <td className="px-2.5 py-2 text-right font-bold border-t-2 border-brand-brown text-brand-brown">
                {fmtBRL(total)}
              </td>
              <td className="border-t-2 border-brand-brown" />
            </tr>
          </tfoot>
        </table>
      </div>
      <button
        onClick={adicionar}
        className="mt-3 w-full border border-dashed border-[#b5a988] bg-transparent text-brand-brown px-4 py-2.5 rounded-[10px] cursor-pointer text-[13px] font-semibold hover:bg-brand-card-alt"
      >
        + Adicionar insumo
      </button>
    </div>
  );
}
