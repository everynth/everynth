import Link from "next/link";
import { RemoveButton } from "@/components/remove-button";
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
        <div>
          <p className="kicker rise">Creator · Dashboard</p>
          <h1 className="chrome shimmer rise rise-2 text-3xl font-medium tracking-tight sm:text-5xl">Creator dashboard</h1>
        </div>
        {wallet && (
          <p className="card rise rise-3 font-mono text-sm">
            Earned <span className="chrome text-2xl font-semibold">{formatSol(total)}</span> SOL
          </p>
        )}
      </div>
      {!wallet ? (
        <p className="card">Sign in to see your products.</p>
      ) : rows.length === 0 ? (
        <p className="rise rise-3" style={{ color: "var(--mute)" }}>
          No products yet. <Link href="/launch" className="underline">Launch your first</Link>.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="card rise rise-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-medium">
                  <Link href={`/p/${r.id}`}>{r.title}</Link>
                  {r.status === "removed" && <span className="ml-2 text-sm text-red-400">removed</span>}
                </h2>
                <p className="font-mono text-xs" style={{ color: "var(--mute)" }}>
                  {formatSol(r.price)} SOL · {r.sales} sold · {formatSol(r.revenue)} SOL earned
                </p>
              </div>
              {r.status === "live" && (
                <div className="flex gap-2">
                  <Link href={`/p/${r.id}/edit`} className="btn-ghost">
                    Edit
                  </Link>
                  <RemoveButton productId={r.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
