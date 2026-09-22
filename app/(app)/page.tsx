import Link from "next/link";
import { CATEGORIES } from "@/lib/config";
import { listProducts, PAGE_SIZE, pulse, SORTS, topCreators, trending, type Listed, type Sort } from "@/lib/market";
import { formatSol } from "@/lib/money";

const short = (w: string) => `${w.slice(0, 4)}…${w.slice(-4)}`;
const age = (d: number) => (d < 1 ? "today" : d < 2 ? "1 day" : `${Math.floor(d)} days`);
const kindLabel = { file: "File", secret: "Secret", github: "Repo" } as const;

export default async function Market({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const category = typeof sp.category === "string" && (CATEGORIES as readonly string[]).includes(sp.category) ? sp.category : "";
  const sort: Sort = SORTS.includes(sp.sort as Sort) ? (sp.sort as Sort) : "trending";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const filtering = !!(q || category); // search mode: just the results, no panels
  const [hot, creators, p, list] = await Promise.all([
    filtering ? [] : trending(6), filtering ? [] : topCreators(6),
    filtering ? null : pulse(), listProducts({ q, category, sort, page }),
  ]);
  const pages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
  const href = (patch: Record<string, string | number>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, category, sort, page, ...patch })) if (v && v !== "trending" && v !== 1) u.set(k, String(v));
    const s = u.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="dash">
      {/* row 1: three glass panels */}
      {p && <div className="dash-row3">
        <section className="panel rise" aria-labelledby="trending-h">
          <header className="panel-head"><h2 id="trending-h">🔥 Trending</h2><span>sold · price</span></header>
          <ol className="plist">
            {hot.length === 0 && <li className="pempty">No products yet</li>}
            {hot.map((x) => (
              <li key={x.id}>
                <Link href={`/p/${x.id}`} className="prow">
                  <Avatar seed={x.title} />
                  <span className="prow-name">{x.title}<small>{x.category}</small></span>
                  <span className="prow-val"><b className="chrome">{x.sales}</b><small>{formatSol(x.price)} SOL</small></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel panel-feature rise rise-2" aria-labelledby="pulse-h">
          <div className="feature-left">
            <header className="panel-head"><h2 id="pulse-h">Market pulse</h2><span>mainnet</span></header>
            <dl className="pulse">
              <div><dt>Live products</dt><dd className="chrome">{p.live}</dd></div>
              <div><dt>Purchases settled</dt><dd className="chrome">{p.sales}</dd></div>
              <div><dt>Volume</dt><dd className="chrome">{formatSol(p.volume)}<small> SOL</small></dd></div>
              <div><dt>Creators</dt><dd className="chrome">{p.creators}</dd></div>
            </dl>
          </div>
          <div className="feature-art">
            <p className="kicker">Purchases · last 14 days</p>
            <Spark days={p.days} />
            <p className="feature-note">95% of every sale goes wallet-to-wallet. Nothing is held here.</p>
          </div>
        </section>

        <section className="panel rise rise-3" aria-labelledby="creators-h">
          <header className="panel-head"><h2 id="creators-h">Top creators</h2><span>earned · products</span></header>
          <ol className="plist">
            {creators.length === 0 && <li className="pempty">No creators yet</li>}
            {creators.map((c) => (
              <li key={c.creator}>
                <Link href={`/u/${c.creator}`} className="prow">
                  <Avatar seed={c.creator} />
                  <span className="prow-name mono">{short(c.creator)}<small>{c.sales} sold</small></span>
                  <span className="prow-val"><b className="chrome">{formatSol(c.earned)}</b><small>{c.products} live</small></span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>}

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
            <span className="pcardx-by">{x.category} · {short(x.creator)} · {age(x.age_days)}</span>
            <span className="pcardx-desc">{x.description}</span>
            <span className="pcardx-meta">
              <span className="mono"><b className="chrome">{formatSol(x.price)}</b> SOL</span>
              <span className="mono">{x.sales} sold</span>
            </span>
            <span className={`pill${x.age_days < 3 ? " pill-live" : ""}`}>{x.age_days < 3 ? "● New" : kindLabel[x.kind]}</span>
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

// Deterministic two-letter monogram on a hue derived from the seed. No images to host.
function Avatar({ seed }: { seed: string }) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return (
    <span className="avatar" style={{ background: `hsl(${hue} 45% 42%)` }} aria-hidden="true">
      {seed.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "EV"}
    </span>
  );
}

function Spark({ days }: { days: number[] }) {
  const max = Math.max(1, ...days);
  const pts = days.map((n, i) => [i * (300 / 13), 90 - (n / max) * 80] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 300 100" preserveAspectRatio="none" aria-label={`${days.reduce((a, b) => a + b, 0)} purchases in the last 14 days`}>
      <path d={`${d} L300 100 L0 100 Z`} fill="rgba(255,255,255,.06)" />
      <path d={d} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className="spark-line" />
      {pts.map(([x, y], i) => days[i] > 0 && <circle key={i} cx={x} cy={y} r="3" fill="#fff" />)}
    </svg>
  );
}
