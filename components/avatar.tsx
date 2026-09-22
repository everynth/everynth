// Deterministic two-letter monogram on a hue derived from the seed. No images to host.
export function Avatar({ seed, size = 34 }: { seed: string; size?: number }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar" style={{ background: `hsl(${h % 360} 45% 42%)`, width: size, height: size }} aria-hidden="true">
      {seed.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "EV"}
    </span>
  );
}

export const short = (w: string) => `${w.slice(0, 4)}…${w.slice(-4)}`;
export const age = (d: number) => (d < 1 ? "today" : d < 2 ? "1 day ago" : `${Math.floor(d)} days ago`);
