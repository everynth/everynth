# Contributing

Issues and pull requests are welcome. Security problems go through
[SECURITY.md](SECURITY.md), never a public issue.

## Running it locally

Needs Node.js 24.

```sh
npm ci
cp .env.example .env.local   # then fill in the values it names
npm run dev
```

With no `DATABASE_URL`, the app opens an embedded Postgres (PGlite) under `./data` and creates the
schema itself. Nothing else needs installing to get the market, the launch console and the docs
running against a throwaway database.

## Checks

```sh
npm run lint     # eslint
npm test         # unit tests: money, payments, signatures, encryption
npm run build    # type check + production build
```

The end-to-end suite drives the real HTTP API against a stub Solana RPC and a stub GitHub, and
settles real purchases against invented transactions. It needs a built app and two terminals:

```sh
npm run build
$env:RPC_URL="http://127.0.0.1:3199"
$env:GITHUB_API="http://127.0.0.1:3198"
$env:PGLITE_DIR="$env:TEMP\everynth-e2e"
$env:DATABASE_URL=" "
$env:ADMIN_WALLETS=(node scripts/e2e.mjs --admin-wallet)
npx next start -p 3100

# in a second terminal
node --env-file=.env.local scripts/e2e.mjs
```

All 25 checks must pass before a pull request is merged. Add a check for anything you fix: the
suite is the reason a refactor of the payment path is survivable.

## House style

- Comments explain **why**, never what the next line already says. Written in English.
- No new dependency for something a few lines of standard library can do.
- Money is lamports, integers, everywhere. Floats never touch a price.
- Anything a wallet signs is built by one shared function used by both the browser and the server,
  so the bytes cannot drift apart.
