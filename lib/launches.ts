import { query } from "./db.ts";

// What the Discover grid needs about a launch: the token, the utility behind it, and enough of the
// product row for agentFor to name the desk. Public by design — a frozen launch is a statement of
// terms, and the point of freezing them is that anyone can read them.
export type LaunchCard = {
  id: string; wallet: string; name: string; ticker: string; status: string; stack: string; created_at: Date;
  product_id: string; title: string; category: string; creator: string;
};

export const listLaunches = (limit = 48) =>
  query<LaunchCard>(
    `select l.id, l.wallet, l.name, l.ticker, l.status, l.stack, l.created_at,
            p.id as product_id, p.title, p.category, p.creator
     from launches l join products p on p.id = l.product_id
     order by l.created_at desc limit $1`,
    [limit],
  );

/** How many mechanics a launch stacked. The column is a JSON array of hook ids. */
export const hookCount = (stack: string) => {
  try { return (JSON.parse(stack) as string[]).length; } catch { return 0; }
};
