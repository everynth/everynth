import Link from "next/link";
import { notFound } from "next/navigation";
import { RemoveButton } from "@/components/remove-button";
import { query } from "@/lib/db";
import { isAdmin, sessionWallet } from "@/lib/session";
import { UnblockButton } from "./unblock-button";

type Report = { id: string; product_id: string; title: string; status: string; creator: string; reporter: string; reason: string };
type Blocked = { wallet: string; reason: string };

export default async function AdminPage() {
  if (!isAdmin(await sessionWallet())) notFound();
  const reports = await query<Report>(
    `select r.id, r.product_id, p.title, p.status, p.creator, r.reporter, r.reason
     from reports r join products p on p.id = r.product_id order by r.created_at desc limit 200`,
  );
  const blocked = await query<Blocked>(`select wallet, reason from blocked_wallets order by created_at desc`);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        {reports.length === 0 && <p className="opacity-60">No reports.</p>}
        <ul className="flex flex-col gap-3">
          {reports.map((r) => (
            <li key={r.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">
                  <Link href={`/p/${r.product_id}`}>{r.title}</Link>
                  {r.status === "removed" && <span className="ml-2 text-sm text-red-600">removed</span>}
                </h2>
                <p className="text-sm opacity-80">{r.reason}</p>
                <p className="font-mono text-xs opacity-60">
                  creator <Link href={`/u/${r.creator}`} className="underline">{r.creator}</Link> · reported by {r.reporter}
                </p>
              </div>
              {r.status === "live" && (
                <div className="flex flex-wrap gap-2">
                  <RemoveButton productId={r.product_id} />
                  <RemoveButton productId={r.product_id} block />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Blocked wallets</h2>
        {blocked.length === 0 && <p className="opacity-60">None.</p>}
        <ul className="flex flex-col gap-3">
          {blocked.map((b) => (
            <li key={b.wallet} className="card flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="break-all font-mono text-sm">{b.wallet}</p>
                <p className="text-xs opacity-60">{b.reason}</p>
              </div>
              <UnblockButton wallet={b.wallet} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
