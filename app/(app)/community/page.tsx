import Link from "next/link";
import { rooms } from "@/lib/community";

export const metadata = { title: "Community · EVERYNTH", description: "A room for every coin on the launchpad. Anyone reads; holders write." };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const ago =(iso: string | null) => {
  if (!iso) return "no messages yet";
  const m = Math.round((Date.now() - Date.parse(iso.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00"))) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

/** The rooms: one per coin on the curve, busiest first. */
export default async function CommunityPage() {
  const list = await rooms();
  const total = list.reduce((a, r) => a + r.messages, 0);
  return (
    <div className="dash">
      <div className="dash-sec rise">
        <div>
          <p className="kicker">Community · holders only</p>
          <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Community</h1>
          <p className="dash-sec-sub">
            A room for every coin on the launchpad. Anyone can read. Only wallets holding the coin — and its launcher — can write,
            and every message shows what its author held when they wrote it, read from the chain.
          </p>
        </div>
        <div className="dash-sec-actions"><span className="pill pill-live">{plural(list.length, "room")} · {plural(total, "message")}</span></div>
      </div>

      {list.length === 0 ? (
        <div className="panel rise rise-2"><p className="lpf-sub" style={{ margin: 0 }}>No coin is on the curve yet. A room opens the moment one is.</p></div>
      ) : (
        <ul className="rooms rise rise-2">
          {list.map((r) => (
            <li key={r.id}>
              <Link href={`/community/${r.slug ?? r.id}`} className="room" style={{ "--dom": r.color } as React.CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element -- our own API route */}
                <img src={`/api/launches/${r.id}/logo`} alt="" />
                <span className="room-main">
                  <b>{r.name} <small>${r.ticker}</small></b>
                  <span className="room-last">{r.last_body ? `“${r.last_body.slice(0, 120)}${r.last_body.length > 120 ? "…" : ""}”` : r.description}</span>
                </span>
                <span className="room-meta">
                  <span className="pill pill-sm">{r.pair === "evyn" ? "EVYN" : "SOL"} pair</span>
                  <small>{plural(r.messages, "message")} · {r.members} talking</small>
                  <small>{ago(r.last_at)}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
