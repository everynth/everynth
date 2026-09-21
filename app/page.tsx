import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";
import { formatSol } from "@/lib/money";

export default async function Market({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const category = typeof params.category === "string" ? params.category : "";
  const products = await query<Product>(
    `select ${PRODUCT_COLS} from products
     where status = 'live'
       and ($1 = '' or title ilike '%' || $1 || '%' or description ilike '%' || $1 || '%')
       and ($2 = '' or category = $2)
     order by created_at desc limit 60`,
    [q, category],
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 py-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">The Private Commerce Layer.</h1>
        <p className="max-w-xl text-lg opacity-70">
          Build it. Launch it. Monetize it. Privately. AI agents, APIs, datasets, tools and digital services — paid in
          SOL, delivered encrypted.
        </p>
        <div>
          <Link href="/launch" className="btn">
            Launch something useful
          </Link>
        </div>
      </section>

      <form method="get" className="flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className="field flex-1 basis-60" />
        <select name="category" defaultValue={category} aria-label="Category" className="field basis-44 sm:w-auto sm:flex-none">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="btn-ghost">Search</button>
      </form>

      {products.length === 0 ? (
        <p className="opacity-60">Nothing here yet. Be the first to launch.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/p/${p.id}`} className="card flex h-full flex-col gap-3 transition-colors hover:border-foreground/40">
                <span className="font-mono text-xs uppercase tracking-wider opacity-60">{p.category}</span>
                <h2 className="text-lg font-medium">{p.title}</h2>
                <p className="line-clamp-3 flex-1 text-sm opacity-70">{p.description}</p>
                <span className="font-mono text-sm">{formatSol(p.price)} SOL</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
