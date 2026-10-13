import { query } from "./db.ts";

// What a Discover card needs about a launch: the token, its terms, the utility behind it, and
// enough of the product row for agentFor to name the desk. Public by design — a frozen launch is
// a statement of terms, and the point of freezing them is that anyone can read them.
export type LaunchCard = {
  id: string; slug: string | null; wallet: string; name: string; ticker: string; status: string; stack: string;
  supply: string; gate_balance: number; gate_unlocks: string; creator_fee: number; color: string; description: string; created_at: Date;
  product_id: string; title: string; category: string; creator: string; has_cover: boolean;
};

export const listLaunches = (limit = 48) =>
  query<LaunchCard>(
    `select l.id, l.slug, l.wallet, l.name, l.ticker, l.status, l.stack, l.supply::text as supply, l.gate_balance, l.gate_unlocks,
            l.creator_fee, l.color, l.description, l.created_at,
            p.id as product_id, p.title, p.category, p.creator, (p.cover is not null) as has_cover
     from launches l join products p on p.id = l.product_id
     order by l.created_at desc limit $1`,
    [limit],
  );

// The board, left to right. Only the first column can fill until the token program exists; the
// other two are named now so the lifecycle reads the same way it will later.
export const COLUMNS = [
  { status: "frozen", title: "Newly created", sub: "terms frozen, not minted" },
  { status: "pooling", title: "About to graduate", sub: "pool filling, trading opens at the line" },
  { status: "live", title: "Graduated", sub: "trading, holders unlocking" },
] as const;

/** How many mechanics a launch stacked. The column is a JSON array of hook ids. */
export const hooksOf = (stack: string): string[] => {
  try { return JSON.parse(stack) as string[]; } catch { return []; }
};
export const hookCount = (stack: string) => hooksOf(stack).length;
