import Link from "next/link";
import { notFound } from "next/navigation";
import { age, Avatar, short } from "@/components/avatar";
import { OpenContent } from "@/components/open-content";
import { ProductGrid } from "@/components/product-card";
import { RemoveButton } from "@/components/remove-button";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";
import { formatSol, splitPrice } from "@/lib/money";
import { isAdmin, sessionWallet } from "@/lib/session";
import { BuyButton } from "./buy-button";
import { ReportForm } from "./report-form";

const KIND = {
  file: { label: "File", gets: ["The exact bytes the creator uploaded, decrypted on your device", "Re-downloadable from Purchases at any time", "Encrypted before upload — storage only ever holds ciphertext"] },
  secret: { label: "Secret text", gets: ["A private string: API key, invite link, credentials or licence", "Shown after payment, re-openable from Purchases", "Encrypted before upload — nobody but you and the creator can read it"] },
  github: { label: "GitHub repository", gets: ["A read-only collaborator invitation to the creator's private repository", "Always the current version; the creator can revoke on GitHub", "One GitHub account per purchase"] },
} as const;

export default async function ProductPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const wallet = await sessionWallet();
  const [product] = await query<Product & { sales: number; age_days: number }>(
    `select p.id, p.creator, p.title, p.description, p.category, p.price::float8 as price, p.kind, p.file_name, p.github_repo, p.status,
       (p.cover is not null) as has_cover, p.created_at,
       (select count(*) from purchases x where x.product_id = p.id and x.status = 'paid')::int as sales,
       extract(epoch from now() - p.created_at)::float8 / 86400 as age_days
     from products p where p.id = $1`,
    [id],
  );
  if (!product) notFound();

  const [purchase] = wallet
    ? await query<{ id: string }>(`select id from purchases where product_id = $1 and buyer = $2 and status = 'paid'`, [id, wallet])
    : [];
  const isCreator = wallet === product.creator;
  // Removed products stay visible only to people with a reason to see them.
  if (product.status === "removed" && !purchase && !isCreator && !isAdmin(wallet)) notFound();

  const more = await query<Product>(
    `select ${PRODUCT_COLS} from products where creator = $1 and status = 'live' and id <> $2 order by created_at desc limit 4`,
    [product.creator, id],
  );
  const { creatorAmount } = splitPrice(product.price);
  const kind = KIND[product.kind];

  return (
    <div className="detail">
      <p className="crumbs rise">
        <Link href="/" className="navlink">Market</Link> <span>/</span> <Link href={`/?category=${encodeURIComponent(product.category)}`} className="navlink">{product.category}</Link> <span>/</span> <span className="crumb-cur">{product.title}</span>
      </p>

      <div className="detail-grid">
        {/* left column */}
        <div className="detail-main">
          <div className="detail-cover rise">
            {product.has_cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- served from our own API route
              <img src={`/api/products/${product.id}/cover`} alt="" />
            ) : (
              <span className="cover-blank"><span className="chrome">{kind.label.toLowerCase()}</span></span>
            )}
            <span className={`pill detail-badge${product.age_days < 3 ? " pill-live" : ""}`}>{product.age_days < 3 ? "● New" : kind.label}</span>
          </div>

          <div className="rise rise-2">
            <p className="kicker">{product.category} · {kind.label}</p>
            <h1 className="detail-title">{product.title}</h1>
            <p className="detail-by">
              <Avatar seed={product.creator} size={26} />
              <Link href={`/u/${product.creator}`} className="mono">{short(product.creator)}</Link>
              <span>·</span><span>listed {age(product.age_days)}</span>
              <span>·</span><span>{product.sales} sold</span>
            </p>
          </div>

          <section className="panel rise rise-3">
            <header className="panel-head"><h2>About</h2><span>description</span></header>
            <p className="detail-desc">{product.description}</p>
          </section>

          <section className="panel rise rise-3">
            <header className="panel-head"><h2>What you get</h2><span>{product.kind === "file" ? product.file_name : product.kind === "github" ? `github.com/${product.github_repo}` : "secret text"}</span></header>
            <ul className="checks">
              {kind.gets.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </section>

          <section className="panel rise rise-4">
            <header className="panel-head"><h2>How delivery works</h2><span>no custody</span></header>
            <ol className="steps3">
              <li><b>01</b><span>Pay</span><small>One transaction from your wallet: {formatSol(creatorAmount)} SOL to the creator, {formatSol(product.price - creatorAmount)} SOL platform fee.</small></li>
              <li><b>02</b><span>Verify</span><small>The server reads the confirmed transaction on Solana. Nothing is trusted from the browser.</small></li>
              <li><b>03</b><span>Unlock</span><small>{product.kind === "github" ? "Enter your GitHub username and get invited." : "The key is released and your browser decrypts locally."}</small></li>
            </ol>
          </section>

          {more.length > 0 && (
            <section className="rise rise-4">
              <div className="dash-sec"><div><h2 className="dash-sec-title">More from this creator</h2><p className="dash-sec-sub">Other live products from {short(product.creator)}.</p></div><Link href={`/u/${product.creator}`} className="btn-ghost">View all →</Link></div>
              <div className="mt-4"><ProductGrid products={more} /></div>
            </section>
          )}
        </div>

        {/* right column: purchase panel */}
        <aside className="detail-side">
          <div className="panel buy-panel rise rise-2">
            <p className="kicker">Price</p>
            <p className="buy-price"><span className="chrome">{formatSol(product.price)}</span> <small>SOL</small></p>
            <p className="buy-split">{formatSol(creatorAmount)} SOL to the creator · {formatSol(product.price - creatorAmount)} SOL fee</p>
            <div className="buy-action">
              {product.status === "removed" && <span className="pill">Removed from the market</span>}
              {purchase ? (
                <OpenContent purchaseId={purchase.id} />
              ) : isCreator ? (
                <span className="pill">This is your product</span>
              ) : product.status === "live" && wallet ? (
                <BuyButton productId={product.id} sessionWallet={wallet} />
              ) : product.status === "live" ? (
                <span className="buy-hint">Connect a wallet and sign in (top right) to buy.</span>
              ) : null}
            </div>
            <dl className="buy-facts">
              <div><dt>Kind</dt><dd>{kind.label}</dd></div>
              <div><dt>Category</dt><dd>{product.category}</dd></div>
              <div><dt>Sold</dt><dd>{product.sales}</dd></div>
              <div><dt>Listed</dt><dd>{age(product.age_days)}</dd></div>
              <div><dt>Delivery</dt><dd>Instant, encrypted</dd></div>
              <div><dt>Refunds</dt><dd>None</dd></div>
            </dl>
            <div className="buy-actions">
              {wallet && !isCreator && <ReportForm productId={product.id} />}
              {isCreator && product.status === "live" && <Link href={`/p/${product.id}/edit`} className="btn-ghost">Edit listing</Link>}
              {product.status === "live" && (isCreator || isAdmin(wallet)) && <RemoveButton productId={product.id} />}
              {product.status === "live" && !isCreator && isAdmin(wallet) && <RemoveButton productId={product.id} block />}
            </div>
          </div>

          <Link href={`/u/${product.creator}`} className="panel creator-panel rise rise-3">
            <Avatar seed={product.creator} size={44} />
            <span><b className="mono">{short(product.creator)}</b><small>Creator · {more.length + 1} live product{more.length ? "s" : ""}</small></span>
            <span className="creator-arrow">→</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
