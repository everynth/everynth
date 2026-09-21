import Link from "next/link";
import { RemoveButton } from "@/app/remove-button";
import { query } from "@/lib/db";
import { formatSol } from "@/lib/money";
import { sessionWallet } from "@/lib/session";

type Row = { id: string; title: string; status: string; price: number; sales: number; revenue: number };

export default async function DashboardPage() {
  const wallet = await sessionWallet();
  const rows = wallet
    ? await query<Row>(
        `select p.id, p.title, p.status, p.price::float8 as price,
                count(x.id)::int as sales, coalesce(sum(x.creator_amount), 0)::float8 as revenue
         from products p left join purchases x on x.product_id = p.id and x.status = 'paid'
         where p.creator = $1 group by p.id order by p.created_at desc`,
        [wallet],
      )
    : [];
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Creator dashboard</h1>
        {wallet && <p className="font-mono text-sm">Earned: {formatSol(total)} SOL</p>}
      </div>
      {!wallet ? (
        <p className="card">Sign in to see your products.</p>
      ) : rows.length === 0 ? (
        <p className="opacity-60">
          No products yet. <Link href="/launch" className="underline">Launch your first</Link>.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-medium">
                  <Link href={`/p/${r.id}`}>{r.title}</Link>
                  {r.status === "removed" && <span className="ml-2 text-sm text-red-600">removed</span>}
                </h2>
                <p className="font-mono text-xs opacity-60">
                  {formatSol(r.price)} SOL · {r.sales} sold · {formatSol(r.revenue)} SOL earned
                </p>
              </div>
              {r.status === "live" && <RemoveButton productId={r.id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
