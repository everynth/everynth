import { notFound } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { ProductGrid } from "@/components/product-card";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";

// Public creator page: every live product from one wallet.
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
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker rise">Creator</p>
        <h1 className="chrome rise rise-2 break-all font-mono text-xl sm:text-2xl">{wallet}</h1>
      </div>
      {products.length === 0 ? (
        <p className="rise rise-3" style={{ color: "var(--mute)" }}>No live products.</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
