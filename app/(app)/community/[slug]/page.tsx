import Link from "next/link";
import { notFound } from "next/navigation";
import { BODY_MAX, messageIn, messages, standing } from "@/lib/community";
import { getLaunch } from "@/lib/launches";
import { DECIMALS } from "@/lib/mint";
import { sessionWallet } from "@/lib/session";
import { Room } from "./room";

export async function generateMetadata({ params }: PageProps<"/community/[slug]">) {
  const l = await getLaunch((await params).slug);
  return { title: l ? `$${l.ticker} community · EVERYNTH` : "Community · EVERYNTH", description: l?.description };
}

/** One coin's room: the conversation, and whether the signed-in wallet may join it. */
export default async function RoomPage({ params }: PageProps<"/community/[slug]">) {
  const l = await getLaunch((await params).slug);
  if (!l) notFound();
  const wallet = await sessionWallet();
  const [initial, me, pinned] = await Promise.all([
    messages(l.id),
    wallet && l.mint ? standing(l, wallet) : Promise.resolve(null),
    l.pinned_message ? messageIn(l.id, l.pinned_message) : Promise.resolve(null),
  ]);
  const slug = l.slug ?? l.id;
  const held = me ? Number(me.held) / 10 ** DECIMALS : 0;
  return (
    <div className="dash" style={{ "--accent": l.color, "--dom": l.color } as React.CSSProperties}>
      <div className="dash-sec rise">
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
          <img src={`/api/launches/${l.id}/logo`} alt="" width={64} height={64} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", flex: "none", marginTop: 4 }} />
          <div>
            <p className="kicker"><Link href="/community" className="lpf-link">Community</Link> · {l.pair === "evyn" ? "EVYN pair" : "SOL pair"}</p>
            <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{l.name} <span className="lpf-ticker">{l.ticker}</span></h1>
            <p className="dash-sec-sub">{l.description}</p>
          </div>
        </div>
        <div className="dash-sec-actions">
          <Link href={`/t/${slug}`} className="btn">Trade ${l.ticker}</Link>
          <Link href={`/t/${slug}/site`} className="btn-ghost">Website</Link>
          <Link href={`/launchpad/${slug}`} className="btn-ghost">Terms</Link>
        </div>
      </div>
      <Room
        id={l.id}
        ticker={l.ticker}
        launcher={l.wallet}
        open={!!l.mint}
        initial={initial}
        pinned={pinned}
        me={wallet ? { wallet, role: me?.role ?? null, held } : null}
        max={BODY_MAX}
        tradeHref={`/t/${slug}`}
      />
    </div>
  );
}
