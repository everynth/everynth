export const metadata = { title: "Terms — EVERYNTH" };

export default function TermsPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4">
      <p className="kicker rise">Legal</p>
      <h1 className="chrome shimmer rise rise-2 text-3xl font-medium tracking-tight sm:text-5xl">Terms of use</h1>
      <p className="text-sm opacity-60">Last updated: 2026-09-21</p>

      <h2 className="mt-4 text-xl font-medium">What EVERYNTH is</h2>
      <p>
        EVERYNTH is a marketplace where creators list digital products and buyers pay for them in SOL. Payments go
        directly from the buyer&apos;s wallet to the creator&apos;s wallet; EVERYNTH never holds funds. A 5% platform
        fee is paid in the same transaction.
      </p>

      <h2 className="mt-4 text-xl font-medium">No refunds</h2>
      <p>
        Because delivery is instant and payment is on-chain, purchases are final. Read the description carefully before
        buying. If a product does not match its description, report it from the product page.
      </p>

      <h2 className="mt-4 text-xl font-medium">Creators</h2>
      <p>
        You must own the rights to what you sell. Do not list stolen data, malware, pirated content, credentials that are
        not yours, or anything illegal where you or your buyers live. Products that break these rules are removed and
        the creator&apos;s wallet may be blocked. Existing buyers keep access to what they paid for.
      </p>

      <h2 className="mt-4 text-xl font-medium">Privacy</h2>
      <p>
        Product contents are encrypted in your browser before upload. EVERYNTH stores the ciphertext and a wrapped copy
        of the key so it can be delivered to buyers; this means EVERYNTH can technically decrypt contents, and will do
        so only to investigate a report. Wallet addresses and on-chain payments are public by nature of Solana.
      </p>

      <h2 className="mt-4 text-xl font-medium">No warranty</h2>
      <p>
        EVERYNTH is provided as is. We do not guarantee the quality, legality or availability of any product, and we are
        not liable for losses arising from purchases, lost keys or wallet mistakes.
      </p>
    </article>
  );
}
