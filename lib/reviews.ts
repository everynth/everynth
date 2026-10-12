import { MAX_REVIEW_BODY } from "./config.ts";
import { query } from "./db.ts";

// Reviews are the only feedback loop this market has: payment is final and there are no refunds,
// so what a buyer says afterwards is what protects the next one.
// The length limit lives in config.ts so the browser can read it without pulling in the database.

export type Review = { purchase_id: string; buyer: string; rating: number; body: string; age_days: number };
export type Rating = { rating: number; reviews: number };

// Correlated subqueries, not a join: joining would multiply the purchase aggregates next to them.
export const RATING_COLS = `(select coalesce(avg(r.rating), 0) from reviews r where r.product_id = p.id)::float8 as rating,
  (select count(*) from reviews r where r.product_id = p.id)::int as reviews`;

export const listReviews = (productId: string, limit = 20) =>
  query<Review>(
    `select purchase_id, buyer, rating, body, extract(epoch from now() - created_at)::float8 / 86400 as age_days
     from reviews where product_id = $1 order by created_at desc limit $2`,
    [productId, limit],
  );

export const reviewFor = (purchaseId: string) =>
  query<{ rating: number; body: string }>(`select rating, body from reviews where purchase_id = $1`, [purchaseId]);

// A buyer may rewrite their own review; they still only ever have one per purchase.
export const upsertReview = (purchaseId: string, productId: string, buyer: string, rating: number, body: string) =>
  query(
    `insert into reviews (purchase_id, product_id, buyer, rating, body) values ($1, $2, $3, $4, $5)
     on conflict (purchase_id) do update set rating = excluded.rating, body = excluded.body, created_at = now()`,
    [purchaseId, productId, buyer, rating, body],
  );

export function parseReview(input: unknown): { rating: number; body: string } | string {
  const { rating, body } = (input ?? {}) as { rating?: unknown; body?: unknown };
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) return "rating must be a whole number from 1 to 5";
  const text = typeof body === "string" ? body.trim() : "";
  if (text.length > MAX_REVIEW_BODY) return `review must be ${MAX_REVIEW_BODY} characters or fewer`;
  return { rating: rating as number, body: text };
}
