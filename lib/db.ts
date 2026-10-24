import { mkdirSync } from "node:fs";

// Production: Neon Postgres via DATABASE_URL (set by the Vercel integration). Local dev/tests: embedded PGlite in ./data.
// Same SQL either way; the only difference is who opens the connection.

const SCHEMA = `
create table if not exists products (
  id text primary key,
  creator text not null,
  title text not null,
  description text not null,
  category text not null,
  price bigint not null,              -- lamports
  kind text not null,                 -- 'file' | 'secret'
  file_name text,
  file_type text,
  payload bytea not null,             -- iv | AES-GCM ciphertext, encrypted in the creator's browser
  wrapped_key text not null,          -- content key wrapped with MASTER_KEY
  status text not null default 'live',-- 'live' | 'removed'
  created_at timestamptz not null default now()
);
create table if not exists purchases (
  id text primary key,
  product_id text not null references products(id),
  buyer text not null,
  reference text not null unique,
  creator text not null,              -- payout terms frozen at order time
  creator_amount bigint not null,
  treasury text not null,
  fee bigint not null,
  signature text unique,              -- one on-chain tx can settle one purchase only
  status text not null default 'pending', -- 'pending' | 'paid'
  created_at timestamptz not null default now()
);
create index if not exists purchases_buyer on purchases (buyer, status);
alter table products add column if not exists cover bytea, add column if not exists cover_type text;
alter table products add column if not exists payload_url text; -- files: ciphertext in Vercel Blob
alter table products alter column payload drop not null;           -- secrets: ciphertext inline
alter table products add column if not exists github_repo text;   -- kind 'github': wrapped_key holds the creator's wrapped token
alter table purchases add column if not exists github_user text;  -- who was invited
alter table products add column if not exists preview_url text;   -- optional public demo / sample / README link
create table if not exists blocked_wallets (
  wallet text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);
create table if not exists reports (
  id text primary key,
  product_id text not null references products(id),
  reporter text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (product_id, reporter)
);
-- Rate limiting lives in the database so every serverless instance counts into the same bucket.
create table if not exists rate_limits (
  bucket_key text not null,
  bucket bigint not null,
  n int not null default 0,
  primary key (bucket_key, bucket)
);
-- One paid purchase buys the right to exactly one review: the purchase id IS the key.
create table if not exists reviews (
  purchase_id text primary key references purchases(id),
  product_id text not null references products(id),
  buyer text not null,
  rating int not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists reviews_product on reviews (product_id, created_at desc);
-- A token launch with its terms frozen under the launcher's signature. Nothing on-chain yet: the
-- program and the pool do not exist, so a row here is a signed intent, and status says only that.
create table if not exists launches (
  id text primary key,
  wallet text not null,
  product_id text not null references products(id),
  name text not null,
  ticker text not null,
  supply bigint not null,
  stack text not null,                -- JSON array of hook ids, in run order
  gate_balance bigint not null,
  gate_unlocks text not null,
  status text not null default 'frozen', -- 'frozen': terms signed, awaiting the program
  signature text not null,
  issued_at bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists launches_wallet on launches (wallet, created_at desc);
-- The project around the token: fee, permalink, the brief for the desk, the site, the links.
alter table launches
  add column if not exists creator_fee int not null default 1,
  add column if not exists dev_buy numeric(7,3) not null default 0,   -- SOL spent in the opening block
  add column if not exists slug text,
  add column if not exists description text not null default '',
  add column if not exists theme text not null default '',
  add column if not exists color text not null default '#79d2f2',
  add column if not exists template text not null default 'basic',
  add column if not exists website text not null default '',
  add column if not exists x text not null default '',
  add column if not exists telegram text not null default '',
  add column if not exists github text not null default '',
  add column if not exists utility_url text not null default '';
create unique index if not exists launches_slug on launches (slug);
-- The token, once it exists: a Token-2022 mint the launcher's wallet created. status 'minted'.
alter table launches
  add column if not exists mint text,
  add column if not exists mint_signature text,
  add column if not exists minted_at timestamptz;
create unique index if not exists launches_mint on launches (mint);
-- What the vault collected for a launch and where it went: one row per fee round per launch.
-- Amounts in lamports (burned in token base units). carry = swept but too small to split yet.
alter table launches add column if not exists carry bigint not null default 0;
alter table launches add column if not exists pair text not null default 'sol'; -- 'evyn' | 'sol': what the curve is quoted in
create table if not exists fee_rounds (
  id text primary key,
  launch_id text not null references launches(id),
  swept bigint not null,
  launcher bigint not null default 0,
  buyback bigint not null default 0,
  burned bigint not null default 0,
  holders bigint not null default 0,
  revshare bigint not null default 0,
  lottery bigint not null default 0,
  held bigint not null default 0,
  txs text not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists fee_rounds_launch on fee_rounds (launch_id, created_at desc);
alter table fee_rounds
  add column if not exists quote text not null default 'SOL',        -- what the round's amounts are in
  add column if not exists burned_quote bigint not null default 0;    -- EVYN burned before the split
-- A studio session: one holder, one agent, a short conversation. Three may be opened per day.
drop table if exists agent_runs; -- the one-brief studio that preceded sessions; never had a row in production
create table if not exists agent_sessions (
  id text primary key,
  wallet text not null,
  agent text not null,
  messages text not null default '[]', -- JSON [{role, content}], user and assistant alternating
  turns int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_sessions_wallet on agent_sessions (wallet, created_at desc);
-- What the desk produced for a launch: one row per job, overwritten when the desk runs again.
create table if not exists launch_deliverables (
  launch_id text not null references launches(id),
  kind text not null,      -- 'identity' (logo + banner) | 'narrative' | 'site'
  agent text not null,
  model text not null,
  output text not null,
  created_at timestamptz not null default now(),
  primary key (launch_id, kind)
);
-- Community: one room per launched coin. Anyone reads; only wallets holding the coin (and its launcher) write.
create table if not exists launch_messages (
  id bigserial primary key,
  launch_id text not null references launches(id),
  wallet text not null,
  role text not null,      -- 'dev' (the launcher) | 'holder'
  held text not null,      -- the coin's base units the wallet held when it wrote, read from the chain
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists launch_messages_room on launch_messages (launch_id, id desc);
alter table launch_messages add column if not exists reply_to bigint; -- the message this one answers, in the same room
alter table launches add column if not exists pinned_message bigint;  -- the one message the launcher pinned in the room
-- The launch's logo and banner as PNG: uploaded by the launcher, or drawn by Prism as SVG and rendered.
create table if not exists launch_images (
  launch_id text not null references launches(id),
  kind text not null,      -- 'logo' (512×512) | 'banner' (1500×500)
  source text not null,    -- 'upload' | 'prism'
  data bytea not null,
  created_at timestamptz not null default now(),
  primary key (launch_id, kind)
);
`;

type Client = { query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> };

async function open(): Promise<Client> {
  const url = process.env.DATABASE_URL?.trim(); // blank = local PGlite (lets tests override .env.local)
  if (url) {
    // Neon over WebSocket (443), pg-compatible API. Works from serverless and from networks that block 5432.
    const { Pool } = await import("@neondatabase/serverless");
    const pool = new Pool({ connectionString: url, max: 3 });
    await pool.query(SCHEMA);
    return pool as unknown as Client;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? "./data/pg";
  mkdirSync(dir, { recursive: true }); // PGlite does not create parent folders
  const pg = new PGlite(dir);
  await pg.exec(SCHEMA);
  return pg as unknown as Client;
}

// Survive Next.js dev hot reloads: one instance per process.
const g = globalThis as { __everynthDb?: Promise<Client> };

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  g.__everynthDb ??= open().catch((e) => {
    delete g.__everynthDb; // do not cache a failed open
    throw e;
  });
  return (await (await g.__everynthDb).query<T>(sql, params)).rows;
}

export type Product = {
  id: string;
  creator: string;
  title: string;
  description: string;
  category: string;
  price: number;
  kind: "file" | "secret" | "github";
  file_name: string | null;
  github_repo: string | null;
  preview_url: string | null;
  status: "live" | "removed";
  has_cover: boolean;
  created_at: Date;
};
// Listing columns only: never select payload / wrapped_key unless delivering content.
export const PRODUCT_COLS =
  "id, creator, title, description, category, price::float8 as price, kind, file_name, github_repo, preview_url, status, (cover is not null) as has_cover, created_at";
