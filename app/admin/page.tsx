import Link from "next/link";
import { notFound } from "next/navigation";
import { RemoveButton } from "@/app/remove-button";
import { query } from "@/lib/db";
import { isAdmin, sessionWallet } from "@/lib/session";

type Row = { id: string; product_id: string; title: string; status: string; reporter: string; reason: string };

export default async function AdminPage() {
  if (!isAdmin(await sessionWallet())) notFound();
  const reports = await query<Row>(
    `select r.id, r.product_id, p.title, p.status, r.reporter, r.reason
     from reports r join products p on p.id = r.product_id order by r.created_at desc limit 200`,
  );

  return (
    <div className="flex flex-col gap-6">
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
              <p className="font-mono text-xs opacity-60">reported by {r.reporter}</p>
            </div>
            {r.status === "live" && <RemoveButton productId={r.product_id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
