import Link from "next/link";
import { OpenContent } from "@/components/open-content";
import { query } from "@/lib/db";
import { sessionWallet } from "@/lib/session";

type Row = { id: string; product_id: string; title: string; category: string };

export default async function PurchasesPage() {
  const wallet = await sessionWallet();
  const rows = wallet
    ? await query<Row>(
        `select x.id, x.product_id, p.title, p.category from purchases x join products p on p.id = x.product_id
         where x.buyer = $1 and x.status = 'paid' order by x.created_at desc`,
        [wallet],
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <p className="kicker rise">Buyer · Purchases</p>
      <h1 className="chrome shimmer rise rise-2 text-3xl font-medium tracking-tight sm:text-5xl">Your purchases</h1>
      {!wallet ? (
        <p className="card">Sign in to see what you own.</p>
      ) : rows.length === 0 ? (
        <p className="rise rise-3" style={{ color: "var(--mute)" }}>
          Nothing yet. <Link href="/" className="underline">Browse the market</Link>.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="card rise rise-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="kicker text-[10.5px]">{r.category}</span>
                <h2 className="font-medium">
                  <Link href={`/p/${r.product_id}`}>{r.title}</Link>
                </h2>
              </div>
              <OpenContent purchaseId={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
