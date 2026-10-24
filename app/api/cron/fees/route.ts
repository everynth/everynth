import { runFeeRound } from "@/lib/fees";

// The fee round, on a schedule (vercel.json) or by hand. Protected by CRON_SECRET: Vercel sends it
// as a bearer token; a scheduler elsewhere can pass ?key= instead. Nothing here takes input.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? new URL(request.url).searchParams.get("key") ?? "";
  if (!secret || given !== secret) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.VAULT_SECRET) return Response.json({ error: "VAULT_SECRET is not set; the vault cannot sign" }, { status: 503 });
  try {
    const rounds = await runFeeRound();
    return Response.json({ ok: true, rounds });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "fee round failed" }, { status: 500 });
  }
}
