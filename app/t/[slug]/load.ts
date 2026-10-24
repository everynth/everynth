import { PublicKey } from "@solana/web3.js";
import { siteData, type Chain, type Round, type SiteData } from "@/components/sites";
import { RPC_URL } from "@/lib/config";
import { messages } from "@/lib/community";
import { query } from "@/lib/db";
import { deliverables, siteCopy } from "@/lib/desk";
import { getLaunch, type LaunchRow } from "@/lib/launches";
import { agentsOn } from "@/lib/launchpad";
import { ataOf, baseUnits, explorer } from "@/lib/mint";
import { bondingCurvePda } from "@/lib/pump";
import { solUsd } from "@/lib/sol-price";
import { curve, largest, trades } from "@/lib/token";

/** The last day's SOL volume over the trades read, and the market cap change against the last trade before a day ago (or the first, when the coin is younger). */
function dayStats(t: Awaited<ReturnType<typeof trades>>, history: { at: string; mcapSol: number }[] | null, mcapNow: number | null) {
  const dayAgo = Date.now() - 86_400_000;
  const base = history?.length ? [...history].reverse().find((h) => Date.parse(h.at) <= dayAgo) ?? history[0] : null;
  return {
    vol24Sol: t ? t.filter((x) => x.at && x.at.getTime() >= dayAgo).reduce((a, x) => a + x.sol, 0) : null,
    change24: mcapNow !== null && base && base.mcapSol > 0 ? (mcapNow / base.mcapSol - 1) * 100 : null,
  };
}

/** Everything the terminal and the website show for a launch: the row, the desk's work, the chain. */
export async function loadSite(slug: string): Promise<{ l: LaunchRow; d: SiteData } | null> {
  const l = await getLaunch(slug);
  if (!l) return null;
  const [work, rounds, chat] = await Promise.all([
    agentsOn(l.pair) ? deliverables(l.id) : Promise.resolve([]),
    // What the vault collected for this coin and where it went, newest first; the website shows the mechanics running.
    l.mint ? query<Round>(`select id, created_at::text as created_at, swept::text as swept, buyback::text as buyback, burned::text as burned, holders::text as holders, held::text as held, quote, burned_quote::text as burned_quote from fee_rounds where launch_id = $1 order by created_at desc limit 8`, [l.id]) : Promise.resolve([]),
    l.mint ? messages(l.id, undefined, 3) : Promise.resolve([]), // the holders, in their own words
  ]);
  const site = siteCopy(work.find((w) => w.kind === "site")?.output ?? "");
  let chain: Chain = { explorer: null, holders: null, top: null, curve: null, trades: null, rpc: RPC_URL, solUsd: null, work, site, rounds, chat };
  if (l.mint) {
    const [top, c, t, fx] = await Promise.all([largest(l.mint), curve(l.mint, l.pair === "evyn" ? "evyn" : "sol"), trades(l.mint), solUsd()]);
    const supply = Number(baseUnits(l.supply));
    const creatorAta = ataOf(new PublicKey(l.mint), new PublicKey(l.wallet)).toBase58(); // the launcher's own token account
    const curvePda = bondingCurvePda(new PublicKey(l.mint)).toBase58(); // owns the unsold supply
    // The curve is a constant product, so its k (from the live reserves) gives the price after any
    // past trade from the tokens the curve held then: price = k / vTok², vTok = 1.073B − sold.
    const history = t && c ? (() => {
      const VTOK = 1.073e9, SELL = 793.1e6;
      const vNow = VTOK - (c.progress / 100) * SELL;
      const k = c.priceQuote * vNow * vNow;
      const toSol = c.priceQuote > 0 ? c.priceSol / c.priceQuote : 1;
      return t.filter((x) => x.at && x.curveTokens > 0).reverse().map((x) => {
        const v = VTOK - (1e9 - x.curveTokens);
        return { at: x.at!.toISOString(), mcapSol: (k / (v * v)) * 1e9 * toSol, side: x.side };
      });
    })() : null;
    chain = {
      ...chain,
      solUsd: fx,
      explorer: explorer("token", l.mint, RPC_URL),
      holders: top?.length ?? null,
      top: top ? top.slice(0, 8).map((h) => ({
        account: h.owner || h.account,
        pct: Math.round((Number(h.amount) / supply) * 1000) / 10,
        tag: h.owner === curvePda ? "bonding curve" : h.account === creatorAta ? "dev" : null,
      })) : null,
      curve: c,
      trades: t?.slice(0, 16).map((x) => ({ signature: x.signature, account: x.account, side: x.side, sol: x.sol, tokens: x.tokens, at: x.at?.toISOString() ?? null })) ?? null,
      history,
      ...dayStats(t, history, c?.marketCapSol ?? null),
      rpc: RPC_URL,
    };
  }
  return { l, d: siteData(l, chain) };
}

export const siteMetadata = (l: LaunchRow, what: "terminal" | "website") => ({
  title: `${l.name} ($${l.ticker})${what === "website" ? "" : " · terminal"}`,
  description: l.description,
  openGraph: { title: `${l.name} ($${l.ticker})`, description: l.description, images: [l.has_banner ? `/api/launches/${l.id}/banner` : `/api/launches/${l.id}/logo`] },
});
