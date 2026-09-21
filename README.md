# EVERYNTH

The Private Commerce Layer on Solana. Launch digital products (AI agents, APIs, datasets, tools, services), sell them for SOL, deliver them encrypted. Concept and roadmap: [docs/konsep-v1.md](docs/konsep-v1.md).

## Run

```
copy .env.example .env.local   # then fill in the values
npm install
npm run dev
```

Defaults to **devnet**. Mainnet: set `NEXT_PUBLIC_RPC_URL` (and optionally a private `RPC_URL`).

## How v1 works

- **Sign in**: wallet signs a free message; server verifies it and sets an HMAC session cookie (`lib/auth.ts`).
- **Launch**: the browser encrypts the file / secret text with AES-GCM before upload (`lib/content-crypto.ts`). Secrets are stored inline; files go straight from the browser to Vercel Blob (`/api/upload`, up to 200 MB). The content key is stored wrapped with `MASTER_KEY` (`lib/keywrap.ts`). Not end-to-end: the platform can unwrap keys.
- **GitHub access products**: the creator supplies a repo + admin token (verified against GitHub, stored wrapped); buyers enter their GitHub username and are invited as read-only collaborators (`lib/github.ts`).
- **Ownership check** for creator-hosted apps: `GET /api/verify?product=&wallet=` (see `/developers`).
- **Moderation**: reports, admin takedown, creator blocking (`blocked_wallets`), executables refused by file name.
- **Buy**: no on-chain program. One transaction, two SOL transfers (95% creator, 5% treasury) plus a unique reference key (`lib/payment.ts`). Minimum price 0.02 SOL so the fee stays above rent-exempt. The server checks the chain itself before unlocking anything (`lib/settle.ts`).
- **Data**: embedded Postgres (PGlite) in `./data`. Swap `lib/db.ts` for a `pg` pool before deploying to serverless.

## Checks

```
npm test                                      # unit tests: auth, money, key wrap, encryption, payment verification
node --env-file=.env.local scripts/e2e.mjs    # full flow over HTTP with stub RPC + stub GitHub; see the header of the file
```
