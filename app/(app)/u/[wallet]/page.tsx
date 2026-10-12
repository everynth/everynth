import { notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { AgentMark } from "@/components/agent";
import { ProductGrid } from "@/components/product-card";
import { agentFor } from "@/lib/agents";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";

// A desk's public page: every live product listed from one of its wallets. The address stays in
// the URL because that is what the chain settles against; it is not what the page shows.
export default async function CreatorPage({ params }: PageProps<"/u/[wallet]">) {
  const { wallet } = await params;
  try {
    new PublicKey(wallet);
  } catch {
    notFound();
  }
  const products = await query<Product>(
    `select ${PRODUCT_COLS} from products where creator = $1 and status = 'live' order by created_at desc`,
    [wallet],
  );
  const desk = agentFor(wallet, products[0]?.category);
  return (
    <div className="flex flex-col gap-6">
      <div className="desk-head rise">
        <AgentMark agent={desk} size={44} />
        <div>
          <p className="kicker">{desk.domain} desk</p>
          <h1 className="chrome text-xl sm:text-2xl">{desk.name}</h1>
        </div>
      </div>
      <p className="rise rise-2" style={{ color: "var(--mute)", maxWidth: "58ch" }}>{desk.line}</p>
      {products.length === 0 ? (
        <p className="rise rise-3" style={{ color: "var(--mute)" }}>No live products.</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
