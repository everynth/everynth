import Link from "next/link";

export const metadata = { title: "For developers — EVERYNTH" };

const SNIPPET = `// 1. Ask the visitor to connect their wallet and sign a message you choose,
//    verify that signature on your side. Now you trust \`wallet\`.
// 2. Ask EVERYNTH whether that wallet bought your product:
const res = await fetch(
  "https://everynth.org/api/verify?product=YOUR_PRODUCT_ID&wallet=" + wallet
);
const { owned } = await res.json(); // { owned: true, since: "2026-09-21T10:00:00Z" }
if (!owned) location.href = "https://everynth.org/p/YOUR_PRODUCT_ID";`;

export default function DevelopersPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4">
      <p className="kicker rise">Developers</p>
      <h1 className="chrome shimmer rise rise-2 text-3xl font-medium tracking-tight sm:text-5xl">Gate your own app with EVERYNTH</h1>
      <p className="opacity-80">
        Sell access to an app, API or agent you host yourself. Instead of handing out a code that can be shared,
        your app asks EVERYNTH whether the visitor&apos;s wallet actually bought the product. Access follows the
        wallet, not a string.
      </p>

      <h2 className="mt-4 text-xl font-medium">1. Launch a product</h2>
      <p className="opacity-80">
        Launch a &quot;secret text&quot; product on the Launch page. The text can simply be your app&apos;s URL. Copy the
        product id from its page URL (<span className="font-mono">/p/&lt;id&gt;</span>).
      </p>

      <h2 className="mt-4 text-xl font-medium">2. Check ownership from your app</h2>
      <pre className="field overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">{SNIPPET}</pre>
      <p className="opacity-80">
        The endpoint is public, CORS-open and unauthenticated: anyone can ask whether a wallet owns a product. That is
        why your app must first prove the visitor controls the wallet (a signed message), exactly as EVERYNTH does at
        sign-in.
      </p>

      <p className="opacity-80">
        Full details, including how to verify the wallet signature on your server, are in the docs:{" "}
        <Link href="/docs/ownership-check" className="underline">Ownership check</Link> and{" "}
        <Link href="/docs/api" className="underline">API reference</Link>.
      </p>

      <h2 className="mt-4 text-xl font-medium">Response</h2>
      <pre className="field overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed">{`{ "owned": true, "since": "2026-09-21T10:00:00.000Z" }
{ "owned": false, "since": null }`}</pre>
    </article>
  );
}
