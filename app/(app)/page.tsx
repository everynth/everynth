import Link from "next/link";
import { age, Avatar, short } from "@/components/avatar";
import { CATEGORIES } from "@/lib/config";
import { listProducts, PAGE_SIZE, SORTS, type Listed, type Sort } from "@/lib/market";
import { formatSol } from "@/lib/money";

const kindLabel = { file: "File", secret: "Secret", github: "Repo" } as const;

export default async function Market({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const category = typeof sp.category === "string" && (CATEGORIES as readonly string[]).includes(sp.category) ? sp.category : "";
  const sort: Sort = SORTS.includes(sp.sort as Sort) ? (sp.sort as Sort) : "trending";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const filtering = !!(q || category);
  const list = await listProducts({ q, category, sort, page });
  const pages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
  const href = (patch: Record<string, string | number>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, category, sort, page, ...patch })) if (v && v !== "trending" && v !== 1) u.set(k, String(v));
    const s = u.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="dash">
      {/* section head + filters */}
      <div className="dash-sec rise rise-3">
        <div>
          <h2 className="dash-sec-title">{filtering ? `Results${q ? ` for “${q}”` : ""}${category ? ` in ${category}` : ""}` : "Live products"}</h2>
          <p className="dash-sec-sub">
            {filtering ? <Link href="/" className="navlink" style={{ padding: 0 }}>← Back to the market</Link> : "Everything on the market right now. Files, secrets and repository access — paid in SOL, delivered encrypted."}
          </p>
        </div>
        <div className="dash-sec-actions">
          <Link href="/launch" className="btn">Launch a product</Link>
          <a href="/landing.html" className="btn-ghost">How it works →</a>
        </div>
      </div>
      <form method="get" className="dash-filters rise rise-4">
        <div className="tabs" role="tablist" aria-label="Sort">
          {SORTS.map((s) => (
            <Link key={s} href={href({ sort: s, page: 1 })} className={`tab-pill${sort === s ? " is-active" : ""}`} role="tab" aria-selected={sort === s}>
              {s === "trending" ? "🔥 Trending" : s === "new" ? "New" : "Price"}
            </Link>
          ))}
        </div>
        <input type="hidden" name="sort" value={sort} />
        <input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className="field dash-search" />
        <select name="category" defaultValue={category} aria-label="Category" className="field dash-cat">
          <option value="">All</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="btn-ghost">Filter</button>
      </form>

      {/* full card grid of the listing */}
      <div className="dash-cards dash-cards-all">
        {list.rows.length === 0 && (
          <div className="pcardx pcardx-empty rise">
            <span className="pcardx-title">{filtering ? "No products match." : "Nothing launched yet"}</span>
            <span className="pcardx-desc">{filtering ? "Try another word or category." : "Be the first: encrypted delivery, paid in SOL."}</span>
            {!filtering && <Link href="/launch" className="btn">Launch a product</Link>}
          </div>
        )}
        {list.rows.map((x: Listed, i) => (
          <Link key={x.id} href={`/p/${x.id}`} className="pcardx rise" style={{ animationDelay: `${120 + Math.min(i, 10) * 50}ms` }}>
            <span className="pcardx-cover">
              {x.has_cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- our own API route
                <img src={`/api/products/${x.id}/cover`} alt="" />
              ) : (
                <span className="cover-blank"><span className="chrome">{kindLabel[x.kind].toLowerCase()}</span></span>
              )}
            </span>
            <span className="pcardx-avatar"><Avatar seed={x.creator} /></span>
            <span className="pcardx-title">{x.title}</span>
            <span className="pcardx-by"><b className="cat" data-cat={x.category}>{x.category}</b> · {short(x.creator)} · {age(x.age_days)}</span>
            <span className="pcardx-desc">{x.description}</span>
            <span className="pcardx-meta">
              <span className="mono"><b className="is-price">{formatSol(x.price)}</b> SOL</span>
              <span className="mono">{x.sales} sold</span>
            </span>
            <span className="pcardx-foot">
              <span className={`pill${x.age_days < 3 ? " pill-live" : ""}`}>{x.age_days < 3 ? "● New" : kindLabel[x.kind]}</span>
              {x.preview_url && <span className="pill pill-prev">Preview ↗</span>}
            </span>
          </Link>
        ))}
      </div>
      <div className="panel panel-table rise rise-4">
        <footer className="dtable-foot">
          <span>{list.total} products · {PAGE_SIZE} per page</span>
          <nav className="pager" aria-label="Pages">
            <Link href={href({ page: Math.max(1, page - 1) })} className="pg" aria-disabled={page === 1}>‹</Link>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + Math.max(1, Math.min(page - 2, pages - 4))).map((n) => (
              <Link key={n} href={href({ page: n })} className={`pg${n === page ? " is-active" : ""}`} aria-current={n === page ? "page" : undefined}>{String(n).padStart(2, "0")}</Link>
            ))}
            <Link href={href({ page: Math.min(pages, page + 1) })} className="pg" aria-disabled={page === pages}>›</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
