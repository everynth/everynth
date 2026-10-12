// The builder desks.
//
// A product is listed by a wallet, and that wallet is still what gets paid — it is simply no longer
// what a buyer is shown. Each desk owns one or more listing wallets, so no schema change is needed
// to say who built something: the mapping is wallet -> desk, and the wallet keeps doing its job.
//
// Anything listed by a wallet not yet claimed by a desk falls back to its category, so the market
// never renders a bare address.

export type Domain = "Compute" | "AI" | "Privacy";

export type Agent = {
  id: string;
  name: string;
  domain: Domain;
  /** One line, shown under the name on the desk panel. */
  line: string;
  /** Listing wallets this desk publishes from. */
  wallets: string[];
  /**
   * What this desk is building next, and how far it has got. The number is declared here rather
   * than measured: it is the desk's own statement about its own work, edited in this file when the
   * work moves. No delivery date is published, because none would be honest.
   */
  next: { title: string; progress: number };
};

/** The six stages a build passes through. `at` is the percentage reached once the stage is done. */
export const STAGES = [
  { name: "Brief", at: 10 },
  { name: "Build", at: 55 },
  { name: "Copy", at: 70 },
  { name: "Review", at: 85 },
  { name: "Seal", at: 95 },
  { name: "Live", at: 100 },
] as const;

/** The stage a given percentage is inside, 1-indexed for display. */
export function stageOf(progress: number) {
  const i = STAGES.findIndex((s) => progress < s.at);
  const idx = i === -1 ? STAGES.length - 1 : i;
  return { name: STAGES[idx].name, step: idx + 1, of: STAGES.length };
}

export const AGENTS: Agent[] = [
  {
    id: "anvil",
    name: "Anvil",
    domain: "Compute",
    line: "Builds the things that run: nodes, indexers, pipelines, the plumbing a project needs before it needs anything else.",
    wallets: [],
    next: { title: "RPC Failover Kit", progress: 50 },
  },
  {
    id: "cortex",
    name: "Cortex",
    domain: "AI",
    line: "Builds models, datasets and agents — the work that is only worth buying if someone already did the hard part.",
    wallets: ["DrdYgt5nBZGip2pHYwYPRSX46hLiLk1Qo4Jo27KtMztf"],
    next: { title: "Signal Pack 02", progress: 40 },
  },
  {
    id: "veil",
    name: "Veil",
    domain: "Privacy",
    line: "Builds what people would rather not do in public: sealed markets, private access, anything that settles without an audience.",
    wallets: ["BFjF1f6tLRnokBwuRxhYSggxoG8nxrSDZxj3dMoZd6pN"],
    next: { title: "Sealed Order Book", progress: 20 },
  },
];

const BY_ID = new Map(AGENTS.map((a) => [a.id, a]));
const BY_WALLET = new Map(AGENTS.flatMap((a) => a.wallets.map((w) => [w, a] as const)));

/** Where a category lands when no desk has claimed the listing wallet yet. */
const BY_CATEGORY: Record<string, string> = {
  "AI Agent": "cortex",
  Dataset: "cortex",
  Research: "cortex",
  API: "anvil",
  Service: "anvil",
  Tool: "anvil",
  Community: "veil",
};

export function agentFor(wallet: string, category?: string): Agent {
  return BY_WALLET.get(wallet) ?? BY_ID.get(BY_CATEGORY[category ?? ""] ?? "anvil") ?? AGENTS[0];
}

export type DeskRow = { creator: string; category: string; products: number; sales: number; earned: number };
export type DeskStat = Agent & { products: number; sales: number; earned: number };

/**
 * Folds per-wallet totals into per-desk totals, so a desk's shipped figures come from the database
 * rather than from this file. What it is building next does not: that is declared on the agent.
 */
export function deskStats(rows: DeskRow[]): DeskStat[] {
  const byId = new Map(AGENTS.map((a) => [a.id, { ...a, products: 0, sales: 0, earned: 0 }]));
  for (const r of rows) {
    const d = byId.get(agentFor(r.creator, r.category).id);
    if (!d) continue;
    d.products += r.products;
    d.sales += r.sales;
    // lamports are integers; the SQL sum comes back as float8, so round off the drift
    d.earned += Math.round(r.earned);
  }
  return [...byId.values()];
}
