import { Keypair } from "@solana/web3.js";
import { PRODUCT_COLS, query, type Product } from "@/lib/db";
import { splitPrice } from "@/lib/money";
import { sessionWallet } from "@/lib/session";
import { PURCHASE_COLS, settle, type Purchase } from "@/lib/settle";
import { treasuryWallet } from "@/lib/solana";

const fail = (error: string, status: number) => Response.json({ error }, { status });

// Start a purchase: freeze the payout terms and hand the buyer a unique reference to put in the tx.
export async function POST(request: Request) {
  const buyer = await sessionWallet();
  if (!buyer) return fail("sign in first", 401);
  const { productId } = (await request.json().catch(() => null)) ?? {};
  if (typeof productId !== "string") return fail("productId is required", 400);

  const [product] = await query<Product>(`select ${PRODUCT_COLS} from products where id = $1 and status = 'live'`, [productId]);
  if (!product) return fail("product not found", 404);
  if (product.creator === buyer) return fail("you cannot buy your own product", 400);

  // Reuse the open order instead of stacking new ones, and check the chain first:
  // the buyer may already have paid it (tab closed mid-purchase). Prevents paying twice.
  let [purchase] = await query<Purchase>(
    `select ${PURCHASE_COLS} from purchases where product_id = $1 and buyer = $2 order by status = 'paid' desc, created_at desc limit 1`,
    [productId, buyer],
  );
  if (purchase && (await settle(purchase)) === null) return fail("you already own this", 409);

  if (!purchase) {
    const { fee, creatorAmount } = splitPrice(product.price);
    purchase = {
      id: crypto.randomUUID(),
      product_id: productId,
      buyer,
      reference: Keypair.generate().publicKey.toBase58(),
      creator: product.creator,
      creator_amount: creatorAmount,
      treasury: treasuryWallet(),
      fee,
      status: "pending",
    };
    await query(
      `insert into purchases (id, product_id, buyer, reference, creator, creator_amount, treasury, fee) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [purchase.id, productId, buyer, purchase.reference, purchase.creator, creatorAmount, purchase.treasury, fee],
    );
  }
  return Response.json({
    purchaseId: purchase.id,
    reference: purchase.reference,
    creator: purchase.creator,
    creatorAmount: purchase.creator_amount,
    treasury: purchase.treasury,
    fee: purchase.fee,
  });
}
