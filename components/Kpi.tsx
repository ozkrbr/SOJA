interface KpiProps {
  title: string;
  value: string;
  sub?: string;
  accent: string;
  big?: boolean;
}

export default function Kpi({ title, value, sub, accent, big }: KpiProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-brand-border ${big ? "p-5" : "p-4"}`}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="text-[12px] text-brand-muted2 font-semibold uppercase tracking-[0.5px]">
        {title}
      </div>
      <div
        className={`font-bold font-serif my-1 ${big ? "text-[26px]" : "text-[21px]"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[12px] text-brand-muted">{sub}</div>}
    </div>
  );
}
