import { CATEGORIES } from "@/lib/config";
import { sessionWallet } from "@/lib/session";
import { LaunchForm } from "./launch-form";

const text = (v: string | string[] | undefined, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

// A launch can be started from a link: /launch/product?title=…&price=1. Handy for handing someone a
// half-filled form. Only the typed fields travel — the file and the signature are always yours.
export default async function LaunchPage({ searchParams }: PageProps<"/launch/product">) {
  const wallet = await sessionWallet();
  const sp = await searchParams;
  const category = text(sp.category, 40);
  const initial = {
    title: text(sp.title, 80),
    description: text(sp.description, 4000),
    category: (CATEGORIES as readonly string[]).includes(category) ? category : CATEGORIES[0],
    price: text(sp.price, 20),
    previewUrl: text(sp.preview, 500),
  };
  return (
    <div className="dash">
      <div className="dash-sec">
        <div>
          <p className="kicker rise">Creator · Launch product</p>
          <h1 className="chrome rise rise-2 mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Launch console</h1>
          <p className="dash-sec-sub rise rise-3">
            Encrypted on this device, priced in SOL, paid wallet-to-wallet. Fill the left, watch the right.
          </p>
        </div>
        <p className="mono rise rise-3 text-[11px] uppercase tracking-widest" style={{ color: "var(--dim)" }}>
          aes-256-gcm · client-side · no custody
        </p>
      </div>
      {wallet ? (
        <div className="rise rise-4"><LaunchForm wallet={wallet} initial={initial} /></div>
      ) : (
        <div className="term rise rise-4">
          <div className="term-bar"><span className="term-dots"><i /><i /><i /></span> auth required</div>
          <div className="term-body">
            <p className="lx-cmd"><span>$</span> everynth launch --new</p>
            {/* Not a log line: that class is a three-column grid and this message has no timestamp,
                so it would land in the 12px marker column and wrap one letter per row. */}
            <p className="lx-auth"><span>✗</span><span>no session — connect your wallet and sign in (top right) to launch.</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
