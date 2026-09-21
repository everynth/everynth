import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { ProductGrid } from "@/components/product-card";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";

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
        <p className="kicker rise">Market · Solana mainnet</p>
        <h1 className="chrome shimmer rise rise-2 text-4xl font-medium tracking-tight sm:text-6xl">The Private Commerce Layer.</h1>
        <p className="rise rise-3 max-w-xl text-lg" style={{ color: "var(--ink2)" }}>
          Build it. Launch it. Monetize it. Privately. AI agents, APIs, datasets, tools and digital services — paid in
          SOL, delivered encrypted.
        </p>
        <div className="rise rise-4 flex flex-wrap gap-3">
          <Link href="/launch" className="btn">
            Launch something useful
          </Link>
          <a href="/landing.html" className="btn-ghost">
            How it works
          </a>
        </div>
      </section>

      <form method="get" className="rise rise-4 flex flex-wrap gap-3">
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
        <ProductGrid products={products} />
      )}
    </div>
  );
}
