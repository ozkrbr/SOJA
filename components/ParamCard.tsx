interface ParamCardProps {
  label: string;
  sub?: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  accent: string;
}

export default function ParamCard({
  label,
  sub,
  unit,
  value,
  onChange,
  step = 1,
  accent,
}: ParamCardProps) {
  return (
    <div
      className="bg-white border border-brand-border rounded-xl p-3 text-center shadow-sm"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="text-[11px] font-bold tracking-[0.5px] text-brand-brown">{label}</div>
      <div className="text-[10px] text-brand-muted mt-0.5" style={{ height: 12 }}>
        {sub ?? ""}
      </div>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? 0 : Number(e.target.value))
        }
        className="w-full border-none border-b-2 border-brand-border bg-transparent text-center text-[26px] font-bold font-serif py-1.5 my-1.5"
        style={{ color: accent }}
      />
      <div className="text-[11px] text-brand-muted">{unit}</div>
    </div>
  );
}
