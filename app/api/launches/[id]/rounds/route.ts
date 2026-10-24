import { query } from "@/lib/db";
import { getLaunch } from "@/lib/launches";

// Every fee round the vault ran for a coin, as CSV: anyone can audit the mechanics in a spreadsheet.
// Amounts in whole units — SOL, or EVYN on an EVYN pair; burned tokens in the coin itself.
export async function GET(_request: Request, { params }: RouteContext<"/api/launches/[id]/rounds">) {
  const l = await getLaunch((await params).id);
  if (!l) return new Response("not found", { status: 404 });
  const rows = await query<{ created_at: string; quote: string; swept: string; burned_quote: string; launcher: string; buyback: string; burned: string; holders: string; lottery: string; revshare: string; held: string }>(
    `select created_at::text as created_at, quote, swept::text as swept, burned_quote::text as burned_quote, launcher::text as launcher, buyback::text as buyback,
            burned::text as burned, holders::text as holders, lottery::text as lottery, revshare::text as revshare, held::text as held
     from fee_rounds where launch_id = $1 order by created_at asc`,
    [l.id],
  );
  const q = (r: { quote: string }, v: string) => (Number(v) / (r.quote === "EVYN" ? 1e6 : 1e9)).toString();
  const lines = [
    `round_at_utc,quote,swept,burned_evyn,launcher,buyback,burned_${l.ticker.toLowerCase()},to_holders,lottery,revshare,held`,
    ...rows.map((r) => [r.created_at, r.quote, q(r, r.swept), (Number(r.burned_quote) / 1e6).toString(), q(r, r.launcher), q(r, r.buyback),
      (Number(r.burned) / 1e6).toString(), q(r, r.holders), q(r, r.lottery), q(r, r.revshare), q(r, r.held)].join(",")),
  ];
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${l.slug ?? l.id}-fee-rounds.csv"`,
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
}
