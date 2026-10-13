// The shape of a token launch, and the rules that decide whether it is allowed to proceed.
//
// Safe to import from both browser and server: constants and pure functions only. The flow at
// /launchpad/new holds one Draft and walks it through five steps; every step's validity is decided
// here rather than inside a component, so the review screen and the step buttons can never
// disagree about whether something is ready.

export type Family = "Rewards" | "Trading" | "Access";

export type Hook = {
  id: string;
  name: string;
  family: Family;
  /** Share of whatever fee is still unspent when this hook runs. 0 = takes nothing. */
  take: number;
  config: string;
  line: string;
};

export const HOOKS: Hook[] = [
  { id: "holder", name: "Holder rewards", family: "Rewards", take: 30, config: "paid in SOL, daily", line: "Pays collected fees to holders, pro rata." },
  { id: "stock", name: "Stock rewards", family: "Rewards", take: 40, config: "→ tokenized NVDA", line: "Converts fees into an outside asset and hands it to holders." },
  { id: "lottery", name: "Lottery", family: "Rewards", take: 10, config: "one winner per day", line: "Pools fees and pays one holder per round, weighted by holding." },
  { id: "referral", name: "Referral rewards", family: "Rewards", take: 5, config: "5% to the referrer", line: "Credits the wallet that brought a buyer in." },
  { id: "loyalty", name: "Loyalty rewards", family: "Rewards", take: 10, config: "scales to 2× at 90 days", line: "Scales a holder's share by how long they have held." },
  { id: "revshare", name: "Revenue share", family: "Rewards", take: 15, config: "to the project wallet", line: "Routes a fixed share to named wallets." },

  { id: "buyback", name: "Buyback", family: "Trading", take: 40, config: "market buys, hourly", line: "Spends fees buying the token back off the market." },
  { id: "burn", name: "Auto burn", family: "Trading", take: 0, config: "burns what buyback bought", line: "Supply only ever goes down." },
  { id: "antisnipe", name: "Anti-snipe", family: "Trading", take: 0, config: "first 10 min, 0.5% cap", line: "Caps size and rate of buys in the opening window." },
  { id: "dynfee", name: "Dynamic fee", family: "Trading", take: 0, config: "2–6% by volatility", line: "Moves the fee with conditions, inside bounds set at launch." },
  { id: "lp", name: "LP rewards", family: "Trading", take: 20, config: "to liquidity providers", line: "Pays a share to the wallets providing liquidity." },

  { id: "access", name: "Access rules", family: "Access", take: 0, config: "hold to unlock", line: "Gates the utility behind a balance." },
  { id: "transfer", name: "Transfer rules", family: "Access", take: 0, config: "deny list, 24h lockup", line: "Allow and deny lists, lockups, per-wallet caps." },
  { id: "privacy", name: "Privacy rules", family: "Access", take: 0, config: "opt-in attestation", line: "Jurisdiction or attestation requirements, never a default." },
];

export const FAMILIES: Family[] = ["Rewards", "Trading", "Access"];
/** The protocol's cap on what a whole stack may take out of the fee. */
export const FEE_CEILING = 80;
export const MAX_SUPPLY = 1_000_000_000_000;
export const MIN_SUPPLY = 1_000_000;

export const hookById = (id: string) => HOOKS.find((h) => h.id === id);

/** The three site templates the desk fills in. Shape only; the desk writes the content. */
export const TEMPLATES = [
  { id: "story", name: "Story", line: "Hero, the story in three cards, milestones, updates." },
  { id: "terminal", name: "Terminal", line: "One dark console: terms, chart, changelog. For tools." },
  { id: "gallery", name: "Gallery", line: "Banner first, a grid of what the token unlocks." },
] as const;
export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const FEE_MIN = 1;
export const FEE_MAX = 3;
/** The most SOL a dev may spend in the opening block. A bigger first buy is a rug with extra steps. */
export const DEV_BUY_MAX = 50;

/** What the launcher has assembled so far. Everything optional: the flow fills it in order. */
export type Draft = {
  /** Step 1 — the product this token is for. */
  utility: { id: string; title: string; kind: string; source: "launched" | "bought" } | null;
  /** Step 2 — the project. */
  name: string;
  ticker: string;
  supply: string;
  project: {
    fee: number;            // creator fee, whole percent, FEE_MIN..FEE_MAX
    slug: string;           // permalink: /launchpad/<slug>
    description: string;    // the pitch and the narrative, short
    theme: string;          // the brief for the desk: tone, imagery
    color: string;          // #rrggbb
    template: TemplateId;
    website: string;        // the app, optional
    x: string; telegram: string; github: string; // optional
    utilityUrl: string;     // the utility if it is already reachable, optional
  };
  /** Step 3 — hook ids, in the order they run, and what the dev buys at the open. */
  stack: string[];
  devBuy: string;           // SOL, up to 3 decimals, "0" = none
  /** What holders unlock. Set from the utility; shown on the launch page. */
  gate: { balance: string; unlocks: string };
};

export const EMPTY: Draft = {
  utility: null,
  name: "",
  ticker: "",
  supply: "1000000000",
  project: { fee: 1, slug: "", description: "", theme: "", color: "#79d2f2", template: "story", website: "", x: "", telegram: "", github: "", utilityUrl: "" },
  stack: ["antisnipe", "buyback", "burn"],
  devBuy: "0",
  gate: { balance: "10000", unlocks: "" },
};

export const STEPS = [
  { id: "utility", title: "Utility", blurb: "Buy one, or bring yours" },
  { id: "project", title: "Project", blurb: "Name, ticker, site, story" },
  { id: "mechanics", title: "Mechanics", blurb: "What it does, dev buy" },
  { id: "agents", title: "Agents", blurb: "Logo, banner, site, copy" },
  { id: "launch", title: "Launch", blurb: "Freeze and sign" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

/** What the desk produces for every launch, in the order it works. */
export const DELIVERABLES = [
  { id: "logo", title: "Logo", line: "Mark and wordmark in the project colour." },
  { id: "banner", title: "Banner", line: "Hero and social banner, on theme." },
  { id: "narrative", title: "Narrative", line: "The full story from your pitch: site copy, X thread, launch post." },
  { id: "site", title: "Website", line: "The template filled in and published at the permalink." },
] as const;

const digits = (s: string) => Number(s.replace(/\D/g, "")) || 0;
const sol = (s: string) => (/^\d{1,3}(\.\d{1,3})?$/.test(s) ? Number(s) : NaN);
const url = (s: string) => !s || /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(s);
const handle = (s: string) => !s || /^[A-Za-z0-9_.-]{1,40}$/.test(s);
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,22}[a-z0-9])?$/;
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "").slice(0, 24);

/**
 * The fee waterfall. 100 units enter the stack; each hook takes its share of whatever is still
 * unspent, so moving a hook up the list really does change what it receives.
 */
export function waterfall(stack: string[]) {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return stack.reduce<{ hook: Hook; got: number; after: number }[]>((steps, id) => {
    const hook = hookById(id);
    if (!hook) return steps;
    const remaining = steps.at(-1)?.after ?? 100;
    const got = round1((remaining * hook.take) / 100);
    return [...steps, { hook, got, after: round1(remaining - got) }];
  }, []);
}

export const taken = (stack: string[]) => Math.round((100 - (waterfall(stack).at(-1)?.after ?? 100)) * 10) / 10;

/** Why a step is not finished yet, or null when it is. One reason at a time, the first that bites. */
export function problemWith(step: StepId, d: Draft): string | null {
  switch (step) {
    case "utility":
      return d.utility ? null : "Pick the product this token is for.";
    case "project": {
      const p = d.project;
      if (d.name.trim().length < 2) return "The project needs a name.";
      if (!/^[A-Z0-9]{2,10}$/.test(d.ticker)) return "A ticker is 2–10 letters or digits.";
      const n = digits(d.supply);
      if (n < MIN_SUPPLY) return `Supply starts at ${MIN_SUPPLY.toLocaleString("en-US")}.`;
      if (n > MAX_SUPPLY) return `Supply tops out at ${MAX_SUPPLY.toLocaleString("en-US")}.`;
      if (!Number.isInteger(p.fee) || p.fee < FEE_MIN || p.fee > FEE_MAX) return `The creator fee is a whole ${FEE_MIN}–${FEE_MAX}%.`;
      if (!SLUG.test(p.slug)) return "The permalink is 1–24 lowercase letters, digits or dashes.";
      if (p.description.trim().length < 10) return "Say what the project is, in a sentence or two.";
      if (p.description.length > 280) return "Keep the description under 280 characters; the desk writes the long version.";
      if (p.theme.length > 60) return "Keep the theme to a few words.";
      if (!/^#[0-9a-f]{6}$/i.test(p.color)) return "Pick a colour.";
      if (!TEMPLATES.some((t) => t.id === p.template)) return "Pick a site template.";
      if (!url(p.website)) return "The app link must be an https:// address.";
      if (!url(p.utilityUrl)) return "The utility link must be an https:// address.";
      if (!handle(p.x) || !handle(p.telegram) || !handle(p.github)) return "Socials are handles, not links.";
      if (digits(d.gate.balance) <= 0 || digits(d.gate.balance) > digits(d.supply)) return "The holder gate must be between 1 and the supply.";
      return null;
    }
    case "mechanics": {
      if (d.stack.length === 0) return "Pick at least one mechanic, or the token does nothing.";
      if (taken(d.stack) > FEE_CEILING) return `This stack takes ${taken(d.stack)}% of the fee. The ceiling is ${FEE_CEILING}%.`;
      const buy = sol(d.devBuy);
      if (Number.isNaN(buy)) return "Dev buy is an amount in SOL, up to 3 decimals.";
      if (buy > DEV_BUY_MAX) return `Dev buy tops out at ${DEV_BUY_MAX} SOL.`;
      return null;
    }
    case "agents":
      // Nothing to decide here: the desk works from what the earlier steps said.
      return d.gate.unlocks.trim() ? null : "Pick a utility in step 1 first.";
    case "launch":
      return null;
  }
}

/** Steps before this one that are not finished. The flow refuses to jump over a gap. */
export const blockedBy = (step: StepId, d: Draft) =>
  STEPS.slice(0, STEPS.findIndex((s) => s.id === step)).find((s) => problemWith(s.id, d) !== null)?.id ?? null;

export const ready = (d: Draft) => STEPS.every((s) => problemWith(s.id, d) === null);
