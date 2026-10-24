// Community: a room per launched coin. Reading is public; writing takes a signed-in wallet that holds
// the coin right now (read from the chain on every message), or the coin's launcher. Each message
// keeps what its author held when they wrote it, so "who is talking" is answered by the chain.
import { query } from "./db.ts";
import type { LaunchRow } from "./launches.ts";
import { balanceOf } from "./token.ts";

export const BODY_MAX = 500;
export type Message = { id: string; wallet: string; role: "dev" | "holder"; held: string; body: string; created_at: string };
export type Room = {
  id: string; slug: string | null; name: string; ticker: string; pair: string; color: string; mint: string; description: string;
  messages: number; members: number; last_at: string | null; last_body: string | null;
};

export class ChatError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

/** Every launched coin, busiest room first, then newest coin. */
export const rooms = () =>
  query<Room>(
    `select l.id, l.slug, l.name, l.ticker, l.pair, l.color, l.mint, l.description,
            count(m.id)::int as messages, count(distinct m.wallet)::int as members,
            max(m.created_at)::text as last_at,
            (select body from launch_messages x where x.launch_id = l.id order by x.id desc limit 1) as last_body
     from launches l left join launch_messages m on m.launch_id = l.id
     where l.mint is not null
     group by l.id
     order by max(m.created_at) desc nulls last, l.minted_at desc nulls last`,
  );

/** A room's messages, oldest first: the latest `limit`, or only those after `after` (for polling). */
export async function messages(launchId: string, after?: string, limit = 80): Promise<Message[]> {
  const cols = "id::text as id, wallet, role, held, body, created_at::text as created_at";
  if (after && /^\d+$/.test(after)) {
    return query<Message>(`select ${cols} from launch_messages where launch_id = $1 and id > $2::bigint order by id asc limit $3`, [launchId, after, limit]);
  }
  const rows = await query<Message>(`select ${cols} from launch_messages where launch_id = $1 order by id desc limit $2`, [launchId, limit]);
  return rows.reverse();
}

/** Who may write here: the launcher, or a wallet holding any of the coin. */
export async function standing(l: LaunchRow, wallet: string): Promise<{ role: "dev" | "holder" | null; held: bigint }> {
  if (!l.mint) return { role: null, held: 0n };
  const held = await balanceOf(l.mint, wallet);
  return { role: wallet === l.wallet ? "dev" : held > 0n ? "holder" : null, held };
}

export async function post(l: LaunchRow, wallet: string, raw: unknown): Promise<Message> {
  if (!l.mint) throw new ChatError("the room opens when the coin is on the curve", 409);
  const body = String(raw ?? "").replace(/\r/g, "").trim();
  if (!body || body.length > BODY_MAX) throw new ChatError(`a message is 1–${BODY_MAX} characters`, 400);
  const { role, held } = await standing(l, wallet);
  if (!role) throw new ChatError(`hold some $${l.ticker} to write here — reading is open to everyone`, 403);
  const [m] = await query<Message>(
    `insert into launch_messages (launch_id, wallet, role, held, body) values ($1, $2, $3, $4, $5)
     returning id::text as id, wallet, role, held, body, created_at::text as created_at`,
    [l.id, wallet, role, held.toString(), body],
  );
  return m;
}
