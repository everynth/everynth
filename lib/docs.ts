import { TUTORIAL_DOCS } from "./tutorials.ts";

// Docs navigation. Each slug is a permalink: /docs/<slug>. Content lives in app/docs/content/<slug>.tsx.
export type Doc = { slug: string; title: string; summary: string };
export type DocGroup = { group: string; docs: Doc[] };

export const DOC_GROUPS: DocGroup[] = [
  {
    group: "Start here",
    docs: [
      { slug: "overview", title: "Overview", summary: "What EVERYNTH is, and the one idea behind it: nobody holds the money or the goods." },
      { slug: "getting-started", title: "Getting started", summary: "Wallet, sign-in, network and fees. Five minutes from nothing to your first product." },
      { slug: "faq", title: "FAQ", summary: "Refunds, lost keys, what the platform can and cannot see." },
    ],
  },
  // Watch it happen. The list comes from lib/tutorials.ts, so a new recording needs nothing here.
  { group: "Tutorials", docs: TUTORIAL_DOCS },
  {
    group: "Using EVERYNTH",
    docs: [
      { slug: "selling", title: "Selling", summary: "Launch files, secrets or GitHub access. Pricing, covers, editing, taking a product down." },
      { slug: "buying", title: "Buying", summary: "How a purchase works, what happens if your browser dies mid-payment, and how to unlock." },
      { slug: "github-access", title: "GitHub access products", summary: "Sell read access to a private repository. Token requirements and the buyer flow." },
      { slug: "moderation", title: "Moderation and safety", summary: "Reports, takedowns, blocked creators, refused file types, terms." },
    ],
  },
  {
    group: "Launchpad",
    docs: [
      { slug: "launchpad/overview", title: "Launchpad overview", summary: "A token attached to a utility that already works, on pump.fun's curve, with the vault running the mechanics." },
      { slug: "launchpad/launching", title: "Launching a token", summary: "The five steps, what you sign, what it costs, what happens after the create." },
      { slug: "launchpad/pairs", title: "EVYN or SOL", summary: "What the pair changes: the buy path, fees in EVYN and the burn, the desk." },
      { slug: "launchpad/hooks", title: "Mechanics", summary: "The catalogue, the waterfall, the ceiling, and what runs on chain today." },
      { slug: "launchpad/fee-rounds", title: "Fee rounds", summary: "The vault: sweep, collect, split, carry, every 15 minutes, published per launch." },
      { slug: "launchpad/token-sites", title: "Token sites", summary: "Three templates; the chart, trades, holders, swap and fee schedule, all read from the chain." },
      { slug: "launchpad/desk", title: "The desk", summary: "Identity, narrative and site copy from the agents, for every EVYN-paired launch." },
    ],
  },
  {
    group: "Studio",
    docs: [
      { slug: "studio", title: "The studio", summary: "Five agents, one skill each, open to EVYN holders: the gate, the rooms, the monitor." },
    ],
  },
  {
    // Designed in the open, not shipped. Every page in this group says so at the top.
    group: "Roadmap (design)",
    docs: [
      { slug: "launchpad/hook-marketplace", title: "Hook marketplace", summary: "Anyone can write an on-chain module and be paid when other people's tokens use it." },
      { slug: "launchpad/economics", title: "Economics", summary: "What runs around EVYN today, and the hook economy beyond it." },
      { slug: "launchpad/architecture", title: "On-chain architecture", summary: "What runs where today, Token-2022 transfer hooks, and the gap to on-chain mechanics." },
    ],
  },
  {
    group: "How it works",
    docs: [
      { slug: "payments", title: "Payments", summary: "Native SOL, two transfers in one transaction, the reference key, and how the server verifies." },
      { slug: "encryption", title: "Encryption", summary: "Where the key is made, where it is stored, and the honest limit of v1." },
      { slug: "architecture", title: "Architecture", summary: "Three layers, who sees what, and the stack that runs it." },
    ],
  },
  {
    group: "Developers",
    docs: [
      { slug: "ownership-check", title: "Ownership check", summary: "Gate your own app, API or agent with one request." },
      { slug: "api", title: "API reference", summary: "Every route: inputs, outputs, status codes." },
      { slug: "self-hosting", title: "Running it yourself", summary: "Local setup, environment variables, tests, deploying to Vercel." },
    ],
  },
];

export const DOCS: Doc[] = DOC_GROUPS.flatMap((g) => g.docs);
export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
// Which section a page belongs to, for the line above its title.
export const groupOf = (slug: string) => DOC_GROUPS.find((g) => g.docs.some((d) => d.slug === slug))?.group ?? "Docs";
