// Server side of the studio: the holder gate read off the chain, the daily session quota, and one
// turn of one session with one agent.
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import { query } from "./db.ts";
import { marketSnapshot } from "./market-snapshot.ts";
import { DECIMALS } from "./mint.ts";
import { PAIR_MINT } from "./pump.ts";
import { MIN_HOLD, MSG_MAX, REDIRECT, SESSIONS_PER_DAY, STUDIO, studioAgent, TURNS_PER_SESSION, type StudioAgent } from "./studio.ts";
import { balanceOf } from "./token.ts";

export type Holding = { held: number; needed: number; unlocked: boolean; configured: boolean };

/** Whole EVYN the wallet holds, against the studio's minimum. No pairing configured = locked. */
export async function holding(wallet: string): Promise<Holding> {
  if (!PAIR_MINT) return { held: 0, needed: MIN_HOLD, unlocked: false, configured: false };
  const held = Number(await balanceOf(PAIR_MINT.toBase58(), wallet)) / 10 ** DECIMALS;
  return { held, needed: MIN_HOLD, unlocked: held >= MIN_HOLD, configured: true };
}

/** `image` marks a turn that carried a picture; the picture itself is shown to the agent once and not kept. */
export type Msg = { role: "user" | "assistant"; content: string; image?: boolean };
export type Session = { id: string; agent: string; turns: number; messages: Msg[]; created_at: string };
type Row = Omit<Session, "messages"> & { messages: string };
const COLS = "id, agent, turns, messages, created_at::text as created_at";
const parse = (r: Row): Session => ({ ...r, messages: JSON.parse(r.messages) as Msg[] });

export const studioOn = () => !!process.env.ANTHROPIC_API_KEY;

export class StudioError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

/** A holder's sessions, newest first. */
export const listSessions = async (wallet: string, limit = 12): Promise<Session[]> =>
  (await query<Row>(`select ${COLS} from agent_sessions where wallet = $1 order by created_at desc limit $2`, [wallet, limit])).map(parse);

/** Sessions opened in the last 24 hours: the quota is rolling, not calendar. */
export async function sessionsToday(wallet: string): Promise<number> {
  const [r] = await query<{ n: number }>(`select count(*)::int as n from agent_sessions where wallet = $1 and created_at > now() - interval '1 day'`, [wallet]);
  return r?.n ?? 0;
}

/** What every agent is told: the studio, its own skill, the others, and the rules. */
export function systemFor(a: StudioAgent) {
  const roster = STUDIO.filter((x) => x.id !== a.id).map((x) => `- ${x.id} (${x.name}): ${x.skills.join("; ")}`).join("\n");
  return `You are ${a.name}, one of five agents in the studio of EVERYNTH, a Solana launchpad and market for encrypted digital goods. Coins launched there trade on a pump.fun bonding curve, paired with SOL or with EVYN (the platform coin); creator fees flow to the EVERYNTH vault and are split by the mechanics the launcher chose (launcher share, buyback and burn, holder rewards, lottery, revenue share). The person you are talking to holds EVYN and is working on their own project. This is a conversation: earlier turns are context, and they may ask for revisions.

Your skill, and the only thing you work on: ${a.skills.join("; ")}.

The other agents in the studio:
${roster}

If a message is outside your skill, do not attempt it. Reply with exactly one short sentence naming the agent who should take it and why, and begin that reply with the token ${REDIRECT}<id> — for example "${REDIRECT}analyst The fee split is Analyst's job; ask there and bring the creator fee." If nothing in the studio fits, say so in one sentence with no token. A small clarifying question about your own work is not a redirect.

Rules: deliver the work directly, with no preamble and no closing remarks. Write in the language the person writes in. Be concrete and specific; never pad. Use short markdown headings only when the answer has several parts. Make no price predictions, promise no returns, use no "guaranteed" language; keep every factual claim to what you were told, and mark anything you had to assume with "(assumed)".

${a.system}`;
}

/** One call to one agent over a history: the reply, the model that gave it, and a redirect if it declined. */
export async function ask(agentId: string, history: Anthropic.MessageParam[]): Promise<{ output: string; model: string; redirect: string | null }> {
  const a = studioAgent(agentId);
  if (!a) throw new StudioError("unknown agent", 400);
  // The agents see what is moving on Solana right now, so "what is hyped" has an answer with figures.
  const market = await marketSnapshot();
  const system = systemFor(a) + (market
    ? `\n\n${market}\n\nUse the snapshot when the question is about what is moving on Solana now — name the tokens and quote the figures, say it is a snapshot of this moment, and draw no conclusion about where prices go.`
    : "\n\nNo market feed is available right now; if asked what is moving on Solana, say you cannot see live figures.");
  const client = new Anthropic();
  const res = await client.messages.create({
    model: a.model,
    max_tokens: 6000,
    system,
    messages: history,
    // Opus 5 and Fable 5.1 think adaptively by default; medium effort keeps a turn inside the
    // function's time budget. Haiku 4.5 takes neither setting.
    ...(a.model.startsWith("claude-haiku") ? {} : { output_config: { effort: "medium" } }),
  });
  if (res.stop_reason === "refusal") throw new StudioError("the agent declined this message — rephrase it and try again", 422);
  const raw = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  if (!raw) throw new StudioError("the agent returned nothing — try again", 502);
  const m = new RegExp(`^${REDIRECT}([a-z]+)`).exec(raw);
  const redirect = m && studioAgent(m[1]) ? m[1] : null;
  return { output: redirect ? raw.slice(m![0].length).trim() : raw, model: res.model, redirect };
}

/** An image attached to a turn: a PNG, JPEG, WebP or GIF data URL under 4 MB, as the API's block. */
export const IMAGE_MAX = 4 * 1024 * 1024;
function imageBlock(image: unknown): Anthropic.ImageBlockParam | null {
  if (image == null || image === "") return null;
  const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(image));
  if (!m) throw new StudioError("the image must be a PNG, JPEG, WebP or GIF, sent as a data URL", 400);
  if (m[2].length * 0.75 > IMAGE_MAX) throw new StudioError("keep the image under 4 MB", 413);
  return { type: "image", source: { type: "base64", media_type: m[1] as "image/png" | "image/jpeg" | "image/webp" | "image/gif", data: m[2] } };
}

/** One turn: the person's message (with a picture, if one came along), the agent's reply, both stored. */
async function turn(wallet: string, s: Session, message: string, image?: unknown): Promise<{ session: Session; redirect: string | null }> {
  if (s.turns >= TURNS_PER_SESSION) throw new StudioError(`this session has used its ${TURNS_PER_SESSION} turns — open a new one`, 409);
  const img = imageBlock(image);
  const history: Anthropic.MessageParam[] = [
    ...s.messages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: img ? [img, { type: "text", text: message }] : message },
  ];
  const { output, redirect } = await ask(s.agent, history);
  const messages: Msg[] = [...s.messages, { role: "user", content: message, ...(img ? { image: true } : {}) }, { role: "assistant", content: output }];
  await query(`update agent_sessions set messages = $2, turns = turns + 1, updated_at = now() where id = $1`, [s.id, JSON.stringify(messages)]);
  return { session: { ...s, messages, turns: s.turns + 1 }, redirect };
}

const clean = (message: unknown) => {
  const m = String(message ?? "").trim();
  if (!m || m.length > MSG_MAX) throw new StudioError(`a message is 1–${MSG_MAX} characters`, 400);
  return m;
};

/** Open a session with an agent, inside the daily quota, and take its first turn. */
export async function startSession(wallet: string, agentId: string, message: unknown, image?: unknown) {
  const a = studioAgent(agentId);
  if (!a) throw new StudioError("unknown agent", 400);
  const msg = clean(message);
  if ((await sessionsToday(wallet)) >= SESSIONS_PER_DAY) throw new StudioError(`you have opened ${SESSIONS_PER_DAY} sessions in the last 24 hours — the next one frees up as the oldest expires`, 429);
  const id = randomUUID();
  await query(`insert into agent_sessions (id, wallet, agent) values ($1, $2, $3)`, [id, wallet, a.id]);
  const [row] = await query<Row>(`select ${COLS} from agent_sessions where id = $1`, [id]);
  return turn(wallet, parse(row), msg, image);
}

/** Continue one of the holder's own sessions. */
export async function continueSession(wallet: string, id: string, message: unknown, image?: unknown) {
  const msg = clean(message);
  const [row] = await query<Row>(`select ${COLS} from agent_sessions where id = $1 and wallet = $2`, [id, wallet]);
  if (!row) throw new StudioError("no such session", 404);
  return turn(wallet, parse(row), msg, image);
}
