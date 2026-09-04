const COLORS = [
  "var(--color-accent)",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
];

export function DonutChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number }[];
  formatValue: (value: number) => string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const size = 160;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {total <= 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={20}
          />
        ) : (
          data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const dashoffset = -offsetAcc;
            offsetAcc += dash;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={20}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={dashoffset}
              />
            );
          })
        )}
      </svg>
      <ul className="flex flex-col gap-2 text-sm">
        {data.length === 0 && <li className="text-ink-faint">Sin datos todavía</li>}
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-ink">{d.label}</span>
            <span className="ml-auto pl-4 font-medium text-ink-soft">
              {formatValue(d.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
