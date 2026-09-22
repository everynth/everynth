import { query, type Product } from "./db.ts";

// Read models for the market dashboard. Everything derives from products + purchases.

export type Listed = Product & { sales: number; earned: number; age_days: number };

// Same columns as PRODUCT_COLS, qualified with the products alias, plus the aggregates.
const LISTED_COLS = `p.id, p.creator, p.title, p.description, p.category, p.price::float8 as price, p.kind, p.file_name, p.github_repo, p.preview_url, p.status,
  (p.cover is not null) as has_cover, p.created_at,
  count(x.id)::int as sales, coalesce(sum(x.creator_amount), 0)::float8 as earned,
  extract(epoch from now() - p.created_at)::float8 / 86400 as age_days`;
const LISTED_FROM = `from products p left join purchases x on x.product_id = p.id and x.status = 'paid'`;

export const SORTS = ["trending", "new", "price"] as const;
export type Sort = (typeof SORTS)[number];
export const PAGE_SIZE = 12;

export async function listProducts(opts: { q: string; category: string; sort: Sort; page: number }) {
  const order = opts.sort === "new" ? "p.created_at desc" : opts.sort === "price" ? "p.price desc" : "sales desc, p.created_at desc";
  const rows = await query<Listed & { total: number }>(
    `select ${LISTED_COLS}, count(*) over()::int as total ${LISTED_FROM}
     where p.status = 'live'
       and ($1 = '' or p.title ilike '%' || $1 || '%' or p.description ilike '%' || $1 || '%')
       and ($2 = '' or p.category = $2)
     group by p.id order by ${order} limit $3 offset $4`,
    [opts.q, opts.category, PAGE_SIZE, (opts.page - 1) * PAGE_SIZE],
  );
  return { rows, total: rows[0]?.total ?? 0 };
}

export const trending = (limit = 6) =>
  query<Listed>(`select ${LISTED_COLS} ${LISTED_FROM} where p.status = 'live' group by p.id order by sales desc, p.created_at desc limit $1`, [limit]);

export const newest = (limit = 5) =>
  query<Listed>(`select ${LISTED_COLS} ${LISTED_FROM} where p.status = 'live' group by p.id order by p.created_at desc limit $1`, [limit]);

export type Creator = { creator: string; products: number; sales: number; earned: number };
export const topCreators = (limit = 6) =>
  query<Creator>(
    `select p.creator, count(distinct p.id)::int as products, count(x.id)::int as sales, coalesce(sum(x.creator_amount), 0)::float8 as earned
     from products p left join purchases x on x.product_id = p.id and x.status = 'paid'
     where p.status = 'live' group by p.creator order by earned desc, products desc limit $1`,
    [limit],
  );

export type Pulse = { live: number; sales: number; volume: number; creators: number; days: number[] };
// 14-day purchase counts, oldest first, for the sparkline.
export async function pulse(): Promise<Pulse> {
  const [t] = await query<{ live: number; sales: number; volume: number; creators: number }>(
    `select (select count(*) from products where status = 'live')::int as live,
            (select count(*) from purchases where status = 'paid')::int as sales,
            (select coalesce(sum(creator_amount + fee), 0) from purchases where status = 'paid')::float8 as volume,
            (select count(distinct creator) from products where status = 'live')::int as creators`,
  );
  const daily = await query<{ d: number; n: number }>(
    `select floor(extract(epoch from now() - created_at) / 86400)::int as d, count(*)::int as n
     from purchases where status = 'paid' and created_at > now() - interval '14 days' group by 1`,
  );
  const days = Array.from({ length: 14 }, (_, i) => daily.find((r) => r.d === 13 - i)?.n ?? 0);
  return { ...t, days };
}
