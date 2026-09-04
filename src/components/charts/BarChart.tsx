export function BarChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number }[];
  formatValue: (value: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="pt-5">
      <div className="flex items-end gap-3" style={{ height: 160 }}>
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          const heightPct = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0);
          return (
            <div key={i} className="relative flex h-full flex-1 flex-col items-center justify-end">
              <span
                className={`absolute -top-5 text-xs font-semibold ${isLast ? "text-accent" : "text-ink-faint"}`}
              >
                {d.value > 0 ? formatValue(d.value) : ""}
              </span>
              <div
                className={`w-full rounded-t-md ${isLast ? "bg-accent" : "bg-accent-soft"}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3 border-t border-line pt-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-xs text-ink-faint">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
