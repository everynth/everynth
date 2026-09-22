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
