import { query } from "./db.ts";

// Abuse brake for the endpoints that cost something: a database row per caller per time window.
// Postgres, not memory, because serverless runs many instances and an in-memory counter would reset
// every cold start — a limiter that forgets is not a limiter.
// ponytail: fixed windows, so a burst can straddle a boundary and land 2x the limit; swap in a
// sliding window (or Redis) only if that ever shows up in the numbers.

export type Limit = { limit: number; windowS: number };

export const LIMITS = {
  signIn: { limit: 30, windowS: 600 },    // signature attempts from one address
  launch: { limit: 25, windowS: 3600 },   // products per creator per hour (a real creator never nears this)
  upload: { limit: 20, windowS: 3600 },   // blob upload tokens
  order: { limit: 40, windowS: 3600 },    // buy presses
  review: { limit: 20, windowS: 3600 },
  report: { limit: 10, windowS: 3600 },
  verify: { limit: 300, windowS: 60 },    // public ownership check, called by other people's apps
} as const satisfies Record<string, Limit>;

// The caller: their wallet when we know it, otherwise the client IP as the proxy reports it.
export function callerKey(request: Request, wallet?: string | null): string {
  if (wallet) return `w:${wallet}`;
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  return `ip:${fwd.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown"}`;
}

// True when the call is within budget. Counts first, so a refused call still counts against the burst.
export async function allow(name: keyof typeof LIMITS, key: string): Promise<boolean> {
  const { limit, windowS } = LIMITS[name];
  try {
    // $2 must be cast: an untyped parameter next to a division is read as text and the whole
    // statement fails — which, with the catch below, would silently disable the limiter.
    const [row] = await query<{ n: number }>(
      `insert into rate_limits (bucket_key, bucket, n)
       values ($1, floor(extract(epoch from now()) / $2::int)::bigint, 1)
       on conflict (bucket_key, bucket) do update set n = rate_limits.n + 1
       returning n`,
      [`${name}:${key}`, windowS],
    );
    return (row?.n ?? 1) <= limit;
  } catch {
    return true; // a limiter that breaks must not take the site down with it
  }
}

export const tooMany = (name: keyof typeof LIMITS) =>
  Response.json(
    { error: `too many requests — wait a few minutes and try again` },
    { status: 429, headers: { "retry-after": String(LIMITS[name].windowS) } },
  );

// Old windows are dead weight; drop them on the way past, cheaply and rarely.
export async function sweepLimits(): Promise<void> {
  if (Math.random() > 0.02) return;
  await query(`delete from rate_limits where bucket < floor(extract(epoch from now()) / 60)::bigint - 1440`).catch(() => {});
}
