import { notFound } from "next/navigation";
import { OpenContent } from "@/app/open-content";
import { RemoveButton } from "@/app/remove-button";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";
import { formatSol } from "@/lib/money";
import { isAdmin, sessionWallet } from "@/lib/session";
import { BuyButton } from "./buy-button";
import { ReportForm } from "./report-form";

export default async function ProductPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const wallet = await sessionWallet();
  const [product] = await query<Product>(`select ${PRODUCT_COLS} from products where id = $1`, [id]);
  if (!product) notFound();

  const [purchase] = wallet
    ? await query<{ id: string }>(`select id from purchases where product_id = $1 and buyer = $2 and status = 'paid'`, [id, wallet])
    : [];
  const isCreator = wallet === product.creator;
  // Removed products stay visible only to people with a reason to see them.
  if (product.status === "removed" && !purchase && !isCreator && !isAdmin(wallet)) notFound();

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <span className="font-mono text-xs uppercase tracking-wider opacity-60">{product.category}</span>
      <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
      <p className="font-mono text-xs opacity-60">
        by {product.creator.slice(0, 4)}…{product.creator.slice(-4)} · {product.kind === "file" ? `file: ${product.file_name}` : "secret text"} ·
        delivered encrypted
      </p>
      <p className="whitespace-pre-wrap opacity-80">{product.description}</p>

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-xl">{formatSol(product.price)} SOL</span>
        {product.status === "removed" && <span className="text-sm text-red-600">Removed from the market</span>}
        {purchase ? (
          <OpenContent purchaseId={purchase.id} />
        ) : isCreator ? (
          <span className="text-sm opacity-60">This is your product</span>
        ) : product.status === "live" && wallet ? (
          <BuyButton productId={product.id} sessionWallet={wallet} />
        ) : product.status === "live" ? (
          <span className="text-sm opacity-60">Sign in to buy</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {wallet && !isCreator && <ReportForm productId={product.id} />}
        {product.status === "live" && (isCreator || isAdmin(wallet)) && <RemoveButton productId={product.id} />}
      </div>
    </article>
  );
}
