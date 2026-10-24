import { getLaunch } from "@/lib/launches";

// The token's metadata JSON, pointed to by the mint's on-chain metadata URI. Wallets and explorers
// read name, symbol, description and image from here, so it is public and cached.
export async function GET(request: Request, { params }: RouteContext<"/api/launches/[id]/metadata">) {
  const l = await getLaunch((await params).id);
  if (!l) return Response.json({ error: "not found" }, { status: 404 });
  const origin = new URL(request.url).origin;
  return Response.json(
    {
      name: l.name,
      symbol: l.ticker,
      description: l.description,
      image: `${origin}/api/launches/${l.id}/logo`,
      external_url: `${origin}/t/${l.slug ?? l.id}`,
      attributes: [
        { trait_type: "Utility", value: l.title },
        { trait_type: "Creator fee", value: "100% to the EVERYNTH vault" },
        { trait_type: "Hold to unlock", value: `${Number(l.gate_balance).toLocaleString("en-US")} ${l.ticker}` },
      ],
    },
    { headers: { "cache-control": "public, max-age=300", "access-control-allow-origin": "*" } },
  );
}
