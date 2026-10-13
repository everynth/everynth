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

/** What the launcher has assembled so far. Everything optional: the flow fills it in order. */
export type Draft = {
  /** Step 1 — the product this token is for. */
  utility: { id: string; title: string; kind: string; source: "launched" | "bought" } | null;
  /** Step 2 */
  name: string;
  ticker: string;
  supply: string;
  /** Step 3 — hook ids, in the order they run. */
  stack: string[];
  /** Step 4 */
  gate: { balance: string; unlocks: string };
};

export const EMPTY: Draft = {
  utility: null,
  name: "",
  ticker: "",
  supply: "1000000000",
  stack: ["antisnipe", "buyback", "burn"],
  gate: { balance: "10000", unlocks: "" },
};

export const STEPS = [
  { id: "utility", title: "Utility", blurb: "What the token is for" },
  { id: "token", title: "Token", blurb: "Name, ticker, supply" },
  { id: "mechanics", title: "Mechanics", blurb: "What the token does" },
  { id: "access", title: "Access", blurb: "What holders unlock" },
  { id: "review", title: "Review", blurb: "Freeze and sign" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

const digits = (s: string) => Number(s.replace(/\D/g, "")) || 0;

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
    case "token": {
      if (d.name.trim().length < 2) return "The token needs a name.";
      if (!/^[A-Z0-9]{2,10}$/.test(d.ticker)) return "A ticker is 2–10 letters or digits.";
      const n = digits(d.supply);
      if (n < MIN_SUPPLY) return `Supply starts at ${MIN_SUPPLY.toLocaleString("en-US")}.`;
      if (n > MAX_SUPPLY) return `Supply tops out at ${MAX_SUPPLY.toLocaleString("en-US")}.`;
      return null;
    }
    case "mechanics": {
      if (d.stack.length === 0) return "Pick at least one mechanic, or the token does nothing.";
      if (taken(d.stack) > FEE_CEILING) return `This stack takes ${taken(d.stack)}% of the fee. The ceiling is ${FEE_CEILING}%.`;
      return null;
    }
    case "access": {
      if (digits(d.gate.balance) <= 0) return "Set the balance a holder needs.";
      if (digits(d.gate.balance) > digits(d.supply)) return "The gate asks for more tokens than exist.";
      if (!d.gate.unlocks.trim()) return "Say what a holder gets when they hold enough.";
      return null;
    }
    case "review":
      return null;
  }
}

/** Steps before this one that are not finished. The flow refuses to jump over a gap. */
export const blockedBy = (step: StepId, d: Draft) =>
  STEPS.slice(0, STEPS.findIndex((s) => s.id === step)).find((s) => problemWith(s.id, d) !== null)?.id ?? null;

export const ready = (d: Draft) => STEPS.every((s) => problemWith(s.id, d) === null);
