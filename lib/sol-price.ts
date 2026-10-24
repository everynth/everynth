// SOL in US dollars, cached two minutes. Jupiter's price feed first — the DEX aggregator's own
// number, the one Solana trading UIs show — CoinGecko when it does not answer. Null when neither
// does, and the sites then show SOL figures only.
const TTL = 2 * 60_000;
let cache: { at: number; usd: number } | null = null;

const SOURCES: (() => Promise<number>)[] = [
  async () => {
    const res = await fetch("https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112", { headers: { accept: "application/json" }, signal: AbortSignal.timeout(4000) });
    return Number(((await res.json()) as Record<string, { usdPrice?: number }>).So11111111111111111111111111111111111111112?.usdPrice);
  },
  async () => {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", { headers: { accept: "application/json" }, signal: AbortSignal.timeout(4000) });
    return Number(((await res.json()) as { solana?: { usd?: number } }).solana?.usd);
  },
];

export async function solUsd(): Promise<number | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.usd;
  for (const source of SOURCES) {
    try {
      const usd = await source();
      if (usd > 0) { cache = { at: Date.now(), usd }; return usd; }
    } catch { /* next source */ }
  }
  return cache?.usd ?? null;
}

/** $1,234 · $12.3K · $4.56M, the way a terminal prints a market cap. */
export const usd = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e4 ? `$${(v / 1e3).toFixed(1)}K` : `$${v.toLocaleString("en-US", { maximumFractionDigits: v >= 100 ? 0 : 2 })}`);
