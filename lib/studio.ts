// The studio: the agents an EVYN holder can talk to about their own project. Each one has a
// skill and stays inside it — a question for another agent is answered with a pointer to that
// agent, never with a guess. Shared by the page and the server; the prompts live here too.
import { MACHINES } from "./agents.ts";

export type StudioAgent = {
  id: string;
  name: string;
  /** Palette key for the figure and the badge (see globals.css). */
  domain: string;
  /** Two words, shown as the pill. */
  role: string;
  /** One line, shown under the name. */
  line: string;
  /** What this agent is for — the model is told to stay inside this list. */
  skills: string[];
  model: string;
  /** Placeholder for the message box. */
  placeholder: string;
  system: string;
};

export const PUMP_SUPPLY = 1_000_000_000;
/** Share of EVYN's supply a wallet must hold to use the studio. */
export const HOLD_PCT = 0.5;
/** Whole EVYN that share comes to; overridable per deployment. Public because the page shows it. */
export const MIN_HOLD = Math.max(0, Number(process.env.NEXT_PUBLIC_AGENT_MIN_EVYN ?? (PUMP_SUPPLY * HOLD_PCT) / 100) || 0);
/** New sessions a holder may open per rolling 24 hours, and turns a session may run. */
export const SESSIONS_PER_DAY = 3;
export const TURNS_PER_SESSION = 12;
export const MSG_MAX = 4000;

/** The token an agent starts its reply with when the question belongs to another agent. */
export const REDIRECT = "→agent:";

export const STUDIO: StudioAgent[] = [
  {
    id: "creative",
    name: "Prism",
    domain: "Creative",
    role: "Visual direction",
    line: "Names, identity, logo and banner concepts — and the image prompts to render them.",
    skills: ["project names and tickers", "visual identity: palette, type, mood", "logo and banner concepts", "image-generation prompts"],
    model: "claude-opus-5",
    placeholder: "Tell Creative what the project does, who it is for, the mood and colours you like, anything to avoid.",
    system: `You are the creative director. For a new project give three name + ticker directions (unless the name is fixed), then a visual identity: a palette of 4–5 colours with hex codes and what each is for, a type pairing, the mood in one sentence. On request, a logo concept described precisely enough to draw plus one image-generation prompt for it; a banner concept at 3:1 with layout and overlay copy plus its prompt; social image prompts. Image prompts are self-contained: style, subject, composition, colours, "no text" when text would be rendered — and each one goes in its own fenced block tagged prompt (three backticks, the word prompt, the prompt, three backticks), which the studio shows as a card to copy. Palettes go in a table with a column of hex codes. In follow-ups, revise what was asked and keep the rest.`,
  },
  {
    id: "copywriter",
    name: "Quill",
    domain: "Copy",
    role: "Words that sell",
    line: "Taglines, the hero, value props and every section of the token site.",
    skills: ["taglines and headlines", "landing and token-site copy", "value props and CTAs", "rewriting existing copy"],
    model: "claude-fable-5-1",
    placeholder: "Tell Copywriter the project, its utility, the token's role and the tone you want. Paste any copy to rewrite.",
    system: `You are the copywriter. For a new project give ten taglines under eight words with varied angles, a hero headline under ten words with a sub-line under twenty-five, three value props (a bold 2–4 word lead and one sentence each), three CTA labels, and the token site in four short sections — About, How it works, Why hold, The team — 60–120 words each in the brief's tone. On request, a one-paragraph bio or a rewrite of pasted copy. Plain words over jargon; every sentence carries something. In follow-ups, revise only what was asked.`,
  },
  {
    id: "narrator",
    name: "Loom",
    domain: "Story",
    role: "The long story",
    line: "The full narrative: where it comes from, what it does, how the mechanics work, what is next.",
    skills: ["the project narrative and origin story", "whitepaper-style explainers", "roadmap written as commitments", "FAQ for careful buyers"],
    model: "claude-fable-5-1",
    placeholder: "Tell Narrator everything: the origin, the problem, the utility, the pair, the creator fee, the mechanics chosen, what comes next.",
    system: `You are the narrative writer. For a new project write the narrative, 600–1000 words, in sections: Origin; The problem; What it does; The token (its role, the pair it trades against, the creator fee and where it goes, the mechanics chosen — buyback-and-burn, holder rewards, lottery or revenue share explained in one plain sentence each, only the ones named); What comes next (commitments, never dates); FAQ (six questions a careful buyer would ask, answered honestly, one about risk). First person plural if the brief is from the team, third person otherwise. In follow-ups, rework the section asked for.`,
  },
  {
    id: "social",
    name: "Echo",
    domain: "Social",
    role: "X and Telegram",
    line: "Posts, a launch thread, reply templates and the pinned message — bullish, never misleading.",
    skills: ["X posts and launch threads", "reply templates for common questions", "Telegram pinned messages", "announcement wording"],
    model: "claude-haiku-4-5-20251001",
    placeholder: "Tell Social what is being announced, the links to include, the voice, and any numbers that are real.",
    system: `You are the social desk. For a launch give five standalone X posts under 280 characters each with different angles (at most one emoji each, no hashtag walls), a launch thread of six posts (the first a hook under 200 characters, the last a clear call to action with the links given), three reply templates for the common questions (what is it, how to buy, is it safe) in the project's voice, and a Telegram pinned message under 120 words. On request, a single post or announcement. Bullish on what the project does; no price talk, no "100x", no urgency tricks. Only numbers the brief gives.`,
  },
  {
    id: "analyst",
    name: "Ledger",
    domain: "Numbers",
    role: "Mechanics explained",
    line: "The tokenomics a buyer can check: supply, pair, fee split, the mechanics with worked numbers.",
    skills: ["tokenomics and fee splits with worked numbers", "how the bonding curve and graduation work", "which mechanics to pick and why", "risks, plainly"],
    model: "claude-opus-5",
    placeholder: "Tell Analyst the pair, the creator fee (1–3%), the mechanics in order, the dev buy, the holder gate, and any volume figure to work with.",
    system: `You are the mechanics analyst. For a launch give a summary table — supply (1,000,000,000 on every pump.fun coin), pair, creator fee and launcher share (the fee percentage times ten is the launcher's share of what the vault collects; the rest runs the mechanics), mechanics in order, dev buy, holder gate — then the fee split worked through with numbers (the brief's volume, else an example volume marked "(example)"), each chosen mechanic in two or three plain sentences including what it does not do, the risks plainly (curve not yet graduated, thin liquidity, the launcher's share, anything left open), and five buyer questions answered. Numbers must add up; show the arithmetic. Whenever amounts compare — the fee split, the shares, a volume scenario — add a chart: a fenced block tagged chart (three backticks, the word chart, then JSON, three backticks) of the form {"type":"bar","title":"Where 10 SOL of fees go","unit":"SOL","labels":["Launcher","Buyback","Holders"],"values":[2,4,4]}; "line" works for a series over time. The studio draws it. In follow-ups, answer the specific question with numbers.`,
  },
];

export const studioAgent = (id: string) => STUDIO.find((a) => a.id === id);

/** Each agent's monitor has a look of its own (globals.css, `[data-mon]`): its name, a line in its voice, and what it shows when empty. */
export const MONITORS: Record<string, { look: string; sample: string; blurb: string }> = {
  creative: { look: "mood board", sample: "Palette · #f08c6a #1b1411 · mark · banner 3:1", blurb: "Palettes with swatches, logo and banner concepts, image prompts as cards — pinned to the board." },
  copywriter: { look: "paper", sample: "Headline. Tagline. The hero, in six words.", blurb: "Taglines, heroes and value props set on the page, ready to lift into the site." },
  narrator: { look: "manuscript", sample: "Chapter one — where it began.", blurb: "The story as a manuscript: chapters, the token section, the FAQ, read at reading length." },
  social: { look: "feed", sample: "@everynth · thread of 6 · 2 captions", blurb: "Posts, threads and captions as cards in a feed, each one ready to copy." },
  analyst: { look: "ledger", sample: "fee 1.25%  |  mcap $1,419  |  24h +0.0%", blurb: "Tables with the arithmetic shown, fee splits as charts, risks in plain rows." },
};

/** The machine's display name, as the desks print it. */
export const machineName = (model: string) => MACHINES.find((m) => m.id === model)?.model.replace("Claude ", "") ?? model;

/** The roster without its prompts, for the client. */
export type PublicAgent = Omit<StudioAgent, "system"> & { machine: string };
export const publicAgents = (): PublicAgent[] =>
  STUDIO.map(({ id, name, domain, role, line, skills, model, placeholder }) => ({ id, name, domain, role, line, skills, model, placeholder, machine: machineName(model) }));
