export type DayKey = "today" | "tomorrow";

export function DayToggle({
  value,
  onChange,
}: {
  value: DayKey;
  onChange: (v: DayKey) => void;
}) {
  const options: { key: DayKey; label: string }[] = [
    { key: "today", label: "Aujourd'hui" },
    { key: "tomorrow", label: "Demain" },
  ];

  return (
    <div className="flex gap-2 px-4 pt-2 pb-3">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={{
              borderRadius: 8,
              backgroundColor: active ? "#E8622A" : "transparent",
              color: active ? "#FFFFFF" : "#64748B",
              border: active ? "0.5px solid transparent" : "0.5px solid #1E3A5F",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
