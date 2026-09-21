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
        <p className="font-mono text-xs uppercase tracking-wider opacity-60">Creator</p>
        <h1 className="break-all font-mono text-xl">{wallet}</h1>
      </div>
      {products.length === 0 ? (
        <p className="opacity-60">No live products.</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
