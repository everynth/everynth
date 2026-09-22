// Flat white sparkline: counts per day, oldest first. Line draws itself on mount (CSS).
export function Spark({ days, height = 120 }: { days: number[]; height?: number }) {
  const max = Math.max(1, ...days);
  const n = Math.max(1, days.length - 1);
  const pts = days.map((v, i) => [i * (300 / n), 90 - (v / max) * 80] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg className="spark" style={{ height }} viewBox="0 0 300 100" preserveAspectRatio="none" aria-label={`${days.reduce((a, b) => a + b, 0)} in the last ${days.length} days`}>
      <path d={`${d} L300 100 L0 100 Z`} fill="rgba(255,255,255,.06)" />
      <path d={d} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className="spark-line" />
      {pts.map(([x, y], i) => days[i] > 0 && <circle key={i} cx={x} cy={y} r="3" fill="#fff" />)}
    </svg>
  );
}
