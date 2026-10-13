import { hooksOf, type LaunchRow } from "@/lib/launches";
import { hookById } from "@/lib/launchpad";
import { Basic } from "./basic";
import { Brutal } from "./brutal";
import { Terminal } from "./terminal";

/** Everything a token site shows, flattened from the launch row. The templates only lay it out. */
export type SiteData = {
  slug: string; name: string; ticker: string; description: string; theme: string; color: string; template: string;
  website: string; x: string; telegram: string; github: string; utilityUrl: string;
  utility: string; productId: string; photo: string | null;
  supply: number; creatorFee: number; devBuy: number; mechanics: string[]; gateBalance: number; gateUnlocks: string;
  signedAt: Date;
};

export const siteData = (l: LaunchRow): SiteData => ({
  slug: l.slug ?? l.id, name: l.name, ticker: l.ticker, description: l.description, theme: l.theme, color: l.color, template: l.template,
  website: l.website, x: l.x, telegram: l.telegram, github: l.github, utilityUrl: l.utility_url,
  utility: l.title, productId: l.product_id, photo: l.has_cover ? `/api/products/${l.product_id}/cover` : null,
  supply: Number(l.supply), creatorFee: l.creator_fee, devBuy: Number(l.dev_buy),
  mechanics: hooksOf(l.stack).map((id) => hookById(id)?.name ?? id), gateBalance: Number(l.gate_balance), gateUnlocks: l.gate_unlocks,
  signedAt: new Date(l.created_at),
});

const n = (v: number) => v.toLocaleString("en-US");

/** The copy every template shows, so the three never disagree about what a launch says. */
export const copy = (d: SiteData) => ({
  tagline: d.description,
  // Live numbers come from the pool, and there is no pool yet. The site says so instead of showing zeros.
  stats: [
    ["Market cap", "—"], ["Holders", "—"], ["24h volume", "—"], ["Contract", "after launch"],
  ] as [string, string][],
  terms: [
    ["Supply", `${n(d.supply)} ${d.ticker}, fixed`],
    ["Creator fee", `${d.creatorFee}% of every trade`],
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
  disclaimer: `$${d.ticker} is not live. Terms are frozen under the launcher's signature; nothing is minted until the EVERYNTH token program is. Nothing here is financial advice.`,
});

export function Site({ d }: { d: SiteData }) {
  if (d.template === "terminal") return <Terminal d={d} />;
  if (d.template === "brutal") return <Brutal d={d} />;
  return <Basic d={d} />;
}
