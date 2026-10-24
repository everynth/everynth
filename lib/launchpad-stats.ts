// The launchpad's live numbers: launches by stage, what the curves hold and are worth, the recent
// trade volume, and what the vault's fee rounds collected and paid. Curves and trades are read
// from the chain (cached per mint); fee rounds from the database.
// ponytail: volume is the last 60 trades per coin and the twelve newest launched coins, not an
// all-time indexer; the fee-round totals are the exact all-time figures.
import { query } from "./db.ts";
import { listLaunches, type LaunchCard } from "./launches.ts";
import { solUsd } from "./sol-price.ts";
import { curve, trades } from "./token.ts";

export type CoinStat = { launch: LaunchCard; mcapSol: number; raisedSol: number; progress: number; complete: boolean; volumeSol: number; tradeCount: number };

export async function launchpadStats() {
  const [rows, fx, rounds] = await Promise.all([
    listLaunches(200),
    solUsd(),
    query<{ n: string; swept_sol: string; swept_evyn: string; launcher: string; held: string; buyback: string; burned: string; holders: string; revshare: string; lottery: string; burned_evyn: string }>(
      `select count(*)::text as n,
              coalesce(sum(case when quote = 'SOL' then swept else 0 end), 0)::text as swept_sol,
              coalesce(sum(case when quote = 'EVYN' then swept else 0 end), 0)::text as swept_evyn,
              coalesce(sum(launcher), 0)::text as launcher, coalesce(sum(held), 0)::text as held, coalesce(sum(buyback), 0)::text as buyback, coalesce(sum(burned), 0)::text as burned,
              coalesce(sum(holders), 0)::text as holders, coalesce(sum(revshare), 0)::text as revshare, coalesce(sum(lottery), 0)::text as lottery,
              coalesce(sum(burned_quote), 0)::text as burned_evyn
       from fee_rounds`,
    ).then((r) => r[0]),
  ]);
  const byStatus: Record<"frozen" | "launched" | "graduated", number> = { frozen: 0, launched: 0, graduated: 0 };
  for (const l of rows) if (l.status in byStatus) byStatus[l.status as keyof typeof byStatus]++;

  const coins: CoinStat[] = (await Promise.all(rows.filter((l) => l.mint).slice(0, 12).map(async (l) => {
    const pair = l.pair === "evyn" ? "evyn" : "sol";
    const [c, t] = await Promise.all([curve(l.mint!, pair), trades(l.mint!)]);
    if (!c) return null;
    return { launch: l, mcapSol: c.marketCapSol, raisedSol: c.raisedSol, progress: c.progress, complete: c.complete, volumeSol: (t ?? []).reduce((a, x) => a + x.sol, 0), tradeCount: t?.length ?? 0 };
  }))).filter((x): x is CoinStat => !!x).sort((a, b) => b.mcapSol - a.mcapSol);

  const sum = (k: keyof CoinStat) => coins.reduce((a, c) => a + (c[k] as number), 0);
  const lam = (v: string) => Number(v) / 1e9;
  return {
    fx,
    counts: { total: rows.length, ...byStatus },
    mcapSol: sum("mcapSol"), raisedSol: sum("raisedSol"), volumeSol: sum("volumeSol"), tradeCount: sum("tradeCount"),
    coins,
    rounds: {
      n: Number(rounds?.n ?? 0),
      sweptSol: lam(rounds?.swept_sol ?? "0"), sweptEvyn: Number(rounds?.swept_evyn ?? 0) / 1e6, burnedEvyn: Number(rounds?.burned_evyn ?? 0) / 1e6,
      launcherSol: lam(rounds?.launcher ?? "0"), heldSol: lam(rounds?.held ?? "0"), buybackSol: lam(rounds?.buyback ?? "0"), holdersSol: lam(rounds?.holders ?? "0"),
      revshareSol: lam(rounds?.revshare ?? "0"), lotterySol: lam(rounds?.lottery ?? "0"), burnedTokens: Number(rounds?.burned ?? 0) / 1e6,
    },
  };
}
