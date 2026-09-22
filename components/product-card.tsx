import Link from "next/link";
import type { Product } from "@/lib/db";
import { formatSol } from "@/lib/money";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, i) => (
        <li key={p.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
          <Link href={`/p/${p.id}`} className="card flex h-full flex-col gap-3">
            {p.has_cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- served from our own API route
              <img src={`/api/products/${p.id}/cover`} alt="" className="aspect-[2/1] w-full rounded-xl object-cover" />
            ) : (
              <div className="cover-blank aspect-[2/1] w-full rounded-xl" aria-hidden="true">
                <span className="chrome">{p.kind === "github" ? "repo" : p.kind === "file" ? "file" : "key"}</span>
              </div>
            )}
            <span className="kicker text-[10.5px]">{p.category}</span>
            <h2 className="text-lg font-medium tracking-tight">{p.title}</h2>
            <p className="line-clamp-3 flex-1 text-sm" style={{ color: "var(--mute)" }}>{p.description}</p>
            <span className="flex items-center justify-between font-mono text-sm">
              <span><span className="chrome font-semibold">{formatSol(p.price)}</span> <span style={{ color: "var(--mute)" }}>SOL</span></span>
              {p.preview_url && <span className="pill pill-sm">Preview ↗</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
