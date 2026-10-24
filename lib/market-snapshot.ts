// What is moving on Solana right now, as a short text block the studio's agents are shown. Top
// tokens of the Solana ecosystem by 24h volume from CoinGecko's public API, stablecoins and wrapped
// majors left out, cached for ten minutes. Empty when the feed is down: the agents then say so.
// ponytail: one feed, one cache in memory; add DexScreener/Birdeye for pump-tier memes if holders
// ask for them.

type Coin = { symbol: string; name: string; market_cap: number; total_volume: number; price_change_percentage_24h: number | null };

const DENY = new Set(["usdt", "usdc", "usd1", "usdg", "usds", "usde", "susde", "pyusd", "fdusd", "dai", "usdy", "wsol", "cbbtc", "wbtc", "weth", "wbnb", "steth", "jlp", "bnsol", "jitosol", "msol", "tbtc"]);
const URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=volume_desc&per_page=60&page=1&price_change_percentage=24h";
const TTL = 10 * 60_000;
let cache: { at: number; text: string } | null = null;

const money = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1e3)}K`);

export async function marketSnapshot(): Promise<string> {
  if (cache && Date.now() - cache.at < TTL) return cache.text;
  try {
    const res = await fetch(URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(String(res.status));
    const coins = ((await res.json()) as Coin[]).filter((c) => c.market_cap > 0 && !DENY.has(c.symbol.toLowerCase())).slice(0, 20);
    if (!coins.length) throw new Error("empty");
    const when = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
    const rows = coins.map((c, i) => `${i + 1}. ${c.symbol.toUpperCase()} (${c.name}) — mcap ${money(c.market_cap)} · 24h volume ${money(c.total_volume)} · 24h ${c.price_change_percentage_24h == null ? "n/a" : `${c.price_change_percentage_24h >= 0 ? "+" : ""}${c.price_change_percentage_24h.toFixed(1)}%`}`);
    const text = `Market snapshot — Solana ecosystem tokens by 24h volume, stablecoins and wrapped assets excluded (CoinGecko, fetched ${when}):\n${rows.join("\n")}`;
    cache = { at: Date.now(), text };
    return text;
  } catch {
    return cache?.text ?? "";
  }
}
