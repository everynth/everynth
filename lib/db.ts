import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// ponytail: embedded Postgres (PGlite) on local disk, single process only. Same SQL as real Postgres,
// so going to Supabase means swapping this file for a `pg` Pool on DATABASE_URL; nothing else changes.
// Required before deploying to Vercel (serverless has no persistent disk).

const SCHEMA = `
create table if not exists products (
  id text primary key,
  creator text not null,
  title text not null,
  description text not null,
  category text not null,
  price bigint not null,              -- micro USDC
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
create table if not exists reports (
  id text primary key,
  product_id text not null references products(id),
  reporter text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (product_id, reporter)
);
`;

// Survive Next.js dev hot reloads: one instance per process.
const g = globalThis as { __everynthDb?: Promise<PGlite> };

function db(): Promise<PGlite> {
  return (g.__everynthDb ??= (async () => {
    const dir = process.env.PGLITE_DIR ?? "./data/pg";
    mkdirSync(dir, { recursive: true }); // PGlite does not create parent folders
    const pg = new PGlite(dir);
    await pg.exec(SCHEMA);
    return pg;
  })().catch((e) => {
    delete g.__everynthDb; // do not cache a failed open
    throw e;
  }));
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await (await db()).query<T>(sql, params)).rows;
}

export type Product = {
  id: string;
  creator: string;
  title: string;
  description: string;
  category: string;
  price: number;
  kind: "file" | "secret";
  file_name: string | null;
  status: "live" | "removed";
  created_at: Date;
};
// Listing columns only: never select payload / wrapped_key unless delivering content.
export const PRODUCT_COLS = "id, creator, title, description, category, price::float8 as price, kind, file_name, status, created_at";
