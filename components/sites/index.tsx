import type { Deliverable, SiteCopy } from "@/lib/desk";
import { hooksOf, type LaunchRow } from "@/lib/launches";
import { hookById } from "@/lib/launchpad";
import { APP } from "@/lib/site";
import { usd } from "@/lib/sol-price";

/** Everything a token site shows, flattened from the launch row. The template only lays it out. */
export type SiteData = {
  slug: string; name: string; ticker: string; description: string; theme: string; color: string; template: string;
  website: string; x: string; telegram: string; github: string; utilityUrl: string;
  utility: string; productId: string; photo: string | null;
  /** The coin's pictures: the logo always answers (a default mark at worst); the banner once Prism drew one. */
  logo: string; banner: string | null;
  supply: number; creatorFee: number; devBuy: number; mechanics: string[]; gateBalance: number; gateUnlocks: string;
  signedAt: Date;
  /** Once minted: the contract address, its explorer link, and the largest holders as a share of supply (null = RPC did not answer). */
  pair: "evyn" | "sol"; desk: boolean;
  mint: string | null; explorer: string | null; holders: number | null;
  /** The largest token accounts as a share of supply, tagged the way pump.fun tags them: the curve itself, and the dev. */
  top: { account: string; pct: number; tag: "bonding curve" | "dev" | null }[] | null;
  /** The bonding curve as it stands, and its last trades; null until launched or when the RPC did not answer. */
  curve: {
    priceSol: number; marketCapSol: number; raisedSol: number; priceQuote: number; marketCapQuote: number; raisedQuote: number; progress: number; complete: boolean;
    /** What a trade pays on this curve right now, in basis points, from pump.fun's fee tiers. */
    fees: { protocolBps: number; creatorBps: number } | null;
  } | null;
  trades: { signature: string; at: string | null; account: string; side: "buy" | "sell"; sol: number; tokens: number }[] | null;
  /** Market cap after each trade, oldest first: the chart. */
  history: { at: string; mcapSol: number; side: "buy" | "sell" }[] | null;
  /** SOL traded in the last 24 hours (over the trades read), and market cap change over the same window in percent. */
  vol24Sol: number | null; change24: number | null;
  rpc: string;
  /** SOL in US dollars at render time; null when the price feed did not answer (figures then stay in SOL). */
  solUsd: number | null;
  /** The desk's deliveries, and the site copy parsed from Quill's. */
  work: Deliverable[]; site: SiteCopy | null;
  /** The vault's fee rounds for this coin, newest first: the mechanics, as they actually ran. */
  rounds: Round[];
};

/** One fee round as the website shows it; amounts are base units as text (lamports, or EVYN's 6 decimals when `quote` is EVYN). */
export type Round = { id: string; created_at: string; swept: string; buyback: string; burned: string; holders: string; held: string; quote: string; burned_quote: string };

export type Chain = {
  explorer: string | null; holders: number | null; top: SiteData["top"]; curve: SiteData["curve"]; trades: SiteData["trades"]; history?: SiteData["history"];
  vol24Sol?: number | null; change24?: number | null; rpc: string; solUsd?: number | null; work?: Deliverable[]; site?: SiteCopy | null; rounds?: Round[];
};

export const siteData = (
  l: LaunchRow,
  chain: Chain = { explorer: null, holders: null, top: null, curve: null, trades: null, rpc: "" },
): SiteData => ({
  pair: l.pair === "evyn" ? "evyn" : "sol", desk: l.pair === "evyn",
  mint: l.mint, explorer: chain.explorer, holders: chain.holders, top: chain.top, curve: chain.curve, trades: chain.trades, history: chain.history ?? null,
  vol24Sol: chain.vol24Sol ?? null, change24: chain.change24 ?? null, rpc: chain.rpc, solUsd: chain.solUsd ?? null,
  work: chain.work ?? [], site: chain.site ?? null, rounds: chain.rounds ?? [],
  slug: l.slug ?? l.id, name: l.name, ticker: l.ticker, description: l.description, theme: l.theme, color: l.color, template: l.template,
  website: l.website, x: l.x, telegram: l.telegram, github: l.github, utilityUrl: l.utility_url,
  utility: l.title, productId: l.product_id, photo: l.has_cover ? `/api/products/${l.product_id}/cover` : null,
  logo: `/api/launches/${l.id}/logo`, banner: l.has_banner ? `/api/launches/${l.id}/banner` : null,
  supply: Number(l.supply), creatorFee: l.creator_fee, devBuy: Number(l.dev_buy),
  mechanics: hooksOf(l.stack).map((id) => hookById(id)?.name ?? id), gateBalance: Number(l.gate_balance), gateUnlocks: l.gate_unlocks,
  signedAt: new Date(l.created_at),
});

const n = (v: number) => v.toLocaleString("en-US");

/** The copy the site shows, in one place, so no two sections disagree about what a launch says. */
export const copy = (d: SiteData) => ({
  tagline: d.description,
  // Price and volume come from the pool, and there is no pool yet; holders and the contract come
  // from the chain once minted. The site shows what it knows and a dash for what it does not.
  stats: [
    ["Market cap", d.curve ? (d.solUsd ? usd(d.curve.marketCapSol * d.solUsd) : `${d.curve.marketCapSol.toFixed(2)} SOL`) : "—",
      d.curve ? `${d.solUsd ? `${d.curve.marketCapSol.toFixed(2)} SOL · ` : ""}${d.curve.complete ? "graduated · PumpSwap" : "on the bonding curve"}` : d.mint ? "reading the curve…" : "live when launched"],
    ["Holders", d.holders === null ? "—" : d.holders >= 20 ? "20+" : String(d.holders), d.mint ? "on chain, top 20 accounts" : "live when launched"],
    ["Raised", d.curve ? `${d.curve.raisedSol.toFixed(3)} SOL` : "—", d.curve ? `${d.curve.progress.toFixed(1)}% of the curve` : "live when launched"],
    ["Contract", d.mint ? `${d.mint.slice(0, 4)}…${d.mint.slice(-4)}` : "after launch", d.mint ? "Token-2022 · pump.fun" : "live when launched"],
  ] as [string, string, string][],
  state: d.curve?.complete ? "graduated" : d.mint ? "live" : "frozen",
  ca: d.mint ? { full: d.mint, short: `${d.mint.slice(0, 4)}…${d.mint.slice(-4)}`, explorer: d.explorer } : null,
  terms: [
    ["Supply", `${n(d.supply)} ${d.ticker}, fixed`],
    ["Pair", d.pair === "evyn" ? "EVYN · fees in EVYN, half burned" : "SOL"],
    ["Trading fee", d.curve?.fees ? `${((d.curve.fees.protocolBps + d.curve.fees.creatorBps) / 100).toFixed(2)}% per trade on pump.fun: ${(d.curve.fees.protocolBps / 100).toFixed(2)}% protocol + ${(d.curve.fees.creatorBps / 100).toFixed(2)}% creator` : "pump.fun's curve rate: protocol fee + creator fee"],
    ["Creator fee goes to", "the EVERYNTH vault, in full — it runs the mechanics; nothing to the launcher"],
    ["Dev buy", d.devBuy ? `${d.devBuy} SOL in the opening block` : "none"],
    ["Mechanics", d.mechanics.join(", ") || "none"],
    ["Hold to unlock", `${n(d.gateBalance)} ${d.ticker} → ${d.gateUnlocks}`],
  ] as [string, string][],
  steps: [
    ["Get a wallet", "Phantom or Solflare, on Solana."],
    ["Add SOL", "From any exchange, to that wallet."],
    ["Open the trade panel", `On EVERYNTH, when $${d.ticker} is live.`],
    ["Swap", `SOL for $${d.ticker}. Hold ${n(d.gateBalance)} and the utility opens.`],
  ] as [string, string][],
  links: [
    d.x && ["X", `https://x.com/${d.x}`],
    d.telegram && ["Telegram", `https://t.me/${d.telegram}`],
    d.github && ["GitHub", `https://github.com/${d.github}`],
    d.website && ["App", d.website],
    d.utilityUrl && ["Utility", d.utilityUrl],
  ].filter(Boolean) as [string, string][],
  terms_href: `/launchpad/${d.slug}`,
  terminal_href: `/t/${d.slug}`,
  website_href: `/t/${d.slug}/site`,
  /** A post about the coin, ready in X's composer: name, ticker, what it is for, the contract, the website. */
  share_href: `https://x.com/intent/post?${new URLSearchParams({
    text: `$${d.ticker} — ${d.name}${d.description ? `: ${d.description.slice(0, 140)}${d.description.length > 140 ? "…" : ""}` : ""}\n\n${d.mint ? `CA ${d.mint}\n` : ""}Launched on @everynth, paired with ${d.pair === "evyn" ? "$EVYN" : "SOL"}.`,
    url: `${APP}/t/${d.slug}/site`,
  })}`,
  disclaimer: d.mint
    ? `$${d.ticker} trades on pump.fun's bonding curve${d.curve?.complete ? " and has graduated to its PumpSwap pool" : ""}. It can go to zero. Terms are frozen under the launcher's signature. Nothing here is financial advice.`
    : `$${d.ticker} is not live. Terms are frozen under the launcher's signature; nothing is launched yet. Nothing here is financial advice.`,
});
