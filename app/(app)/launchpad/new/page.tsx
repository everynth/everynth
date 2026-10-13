import Link from "next/link";
import { query } from "@/lib/db";
import { sessionWallet } from "@/lib/session";
import { Flow, type Owned } from "./flow";

export const metadata = {
  title: "Launch a token · EVERYNTH",
  description: "Attach a utility that already works, set what the token does, and freeze the terms.",
};

/**
 * Step 1 needs to know what this wallet owns, and ownership is a database fact rather than
 * something the browser can be trusted to claim. Everything after that is client-side until there
 * is a program to submit to.
 */
export default async function NewLaunchPage() {
  const wallet = await sessionWallet();
  const owned = wallet
    ? await query<Owned>(
        `select id, title, kind, 'launched' as source from products
           where creator = $1 and status = 'live'
         union all
         select p.id, p.title, p.kind, 'bought' as source from products p
           join purchases x on x.product_id = p.id
           where x.buyer = $1 and x.status = 'paid' and p.status = 'live' and p.creator <> $1
         order by title`,
        [wallet],
      )
    : [];

  return (
    <div className="dash">
      <div className="dash-sec rise">
        <div>
          <p className="kicker">Holder · Launch token</p>
          <h1 className="chrome mt-2 text-3xl font-medium tracking-tight sm:text-4xl">Launch a token</h1>
          <p className="dash-sec-sub">
            Five steps, in order. Nothing is minted at the end of them yet —{" "}
            <Link href="/launchpad" className="navlink" style={{ padding: 0 }}>the launchpad is still being built</Link>,
            and this flow exists so the shape of it can be argued with first.
          </p>
        </div>
        <span className="pill pill-soon">◷ Preview</span>
      </div>

      {/* Walkable signed out: the whole page is a preview, and step one says plainly that a
          real launch reads what you own from your wallet. */}
      <Flow owned={owned} />
    </div>
  );
}
