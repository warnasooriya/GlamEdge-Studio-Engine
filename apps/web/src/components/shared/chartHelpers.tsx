export function compactCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return String(Math.round(amount));
}

export function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-lg border border-plum-100 bg-cream-50 px-3 py-2 text-xs shadow-panel dark:border-white/10 dark:bg-plum-800">
      <p className="mb-1 font-medium text-plum-700 dark:text-cream-50">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-plum-500 dark:text-cream-100/70">
          {p.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />}
          {p.name && <span>{p.name}:</span>}
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function EmptyChart({ label }: { label: string }) {
  return <p className="flex h-56 items-center justify-center text-sm text-plum-300 dark:text-cream-100/40">{label}</p>;
}
