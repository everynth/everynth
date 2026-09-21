import Link from "next/link";
import type { Product } from "@/lib/db";
import { formatSol } from "@/lib/money";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <li key={p.id}>
          <Link href={`/p/${p.id}`} className="card flex h-full flex-col gap-3 transition-colors hover:border-foreground/40">
            {p.has_cover && (
              // eslint-disable-next-line @next/next/no-img-element -- served from our own API route
              <img src={`/api/products/${p.id}/cover`} alt="" className="aspect-[2/1] w-full rounded-xl object-cover" />
            )}
            <span className="font-mono text-xs uppercase tracking-wider opacity-60">{p.category}</span>
            <h2 className="text-lg font-medium">{p.title}</h2>
            <p className="line-clamp-3 flex-1 text-sm opacity-70">{p.description}</p>
            <span className="font-mono text-sm">{formatSol(p.price)} SOL</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
