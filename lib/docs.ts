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
    // Designed in the open, not shipped. Every page in this group says so at the top.
    group: "Launchpad (design)",
    docs: [
      { slug: "launchpad/overview", title: "Launchpad overview", summary: "Two halves of one market: a utility proves itself, then a token is attached to it." },
      { slug: "launchpad/hooks", title: "Hooks", summary: "What a hook is, the catalogue, and how several stack into one token's behaviour." },
      { slug: "launchpad/hook-marketplace", title: "Hook marketplace", summary: "Anyone can write a module and be paid when other people's tokens use it." },
      { slug: "launchpad/economics", title: "Economics", summary: "Protocol revenue, what the native token is for, fee discounts and hook mining." },
      { slug: "launchpad/architecture", title: "Architecture", summary: "Token-2022 transfer hooks, what they cannot do, and the gap that has to be designed." },
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
