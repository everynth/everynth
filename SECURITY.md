# Security policy

EVERYNTH moves real money and holds other people's encrypted goods. If something here is wrong,
we want to hear it from you before we hear it from a buyer.

## Reporting a vulnerability

Report privately through a [security advisory](https://github.com/everynth/everynth/security/advisories/new).
Please do not open a public issue for a vulnerability.

- **First response:** within 3 working days.
- **Fix or mitigation for anything critical:** we aim for 7 days, and will tell you if it will take longer.
- **Credit:** you are named in the advisory unless you prefer otherwise.

## In scope

- Anything that lets one wallet spend, list, edit or unlist as another wallet.
- Anything that releases a content key, ciphertext or GitHub token to someone who has not paid.
- Anything that lets a purchase settle without the matching on-chain payment, or lets one
  transaction settle two purchases.
- Session forgery, signature replay across hosts, or replay outside the five-minute window.
- Injection, XSS or path traversal in the app or its API.
- Anything that lets a creator see a buyer's plaintext, or the reverse.

## Out of scope

- The honest limit of v1, which is documented, not a bug: the server can unwrap a content key.
  That is what lets a purchase be delivered while the creator is offline. See
  [Encryption](https://everynth.org/docs/encryption#honest-limit).
- Volatility of SOL, Solana network outages, or RPC rate limits.
- Reports from automated scanners with no demonstrated impact.
- Social engineering of the maintainers or of creators.

## What the design already assumes

These are deliberate, and a report that one of them is "wrong" will be closed with this note:

| Assumption | Why |
|---|---|
| Payment is final, no refunds | Money never passes through the platform, so there is nothing to reverse. Reviews are the feedback loop instead. |
| Executables are refused by name | A marketplace that ships binaries is a malware distributor. Source archives and documents only. |
| One purchase, one review | The purchase id is the review's primary key. There is no way to buy or farm reviews. |
| Listings need a wallet signature | A stolen session cookie can read, but it cannot list, reprice or unlist. |
