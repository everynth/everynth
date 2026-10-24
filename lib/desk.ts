// The desk's work on a launch: the studio's agents, briefed from the launch's own project fields.
// Prism draws the identity (logo + banner, as SVG rendered to PNG), Loom writes the narrative, Quill
// the site copy — in parallel, each job overwriting its row when the desk runs again. EVYN-paired
// coins only; the identity is open before launch so pump.fun's first look already finds the logo.
import { query } from "./db.ts";
import { BANNER, LOGO, putImage, rasterize, stripSvg, svgBlocks } from "./images.ts";
import { hookById } from "./launchpad.ts";
import type { LaunchRow } from "./launches.ts";
import { ask } from "./studio-run.ts";

export type Deliverable = { kind: string; agent: string; model: string; output: string; created_at: string };
export const JOBS = [
  { kind: "identity", agent: "creative", covers: ["logo", "banner"] },
  { kind: "narrative", agent: "narrator", covers: ["narrative"] },
  { kind: "site", agent: "copywriter", covers: ["site"] },
] as const;

/** Everything the launcher told us, as one brief every agent reads. */
export function briefFor(l: LaunchRow): string {
  const stack: string[] = (() => { try { return JSON.parse(l.stack); } catch { return []; } })();
  const mechanics = stack.map((id) => hookById(id)?.name ?? id).join(", ") || "none";
  return [
    `Project: ${l.name} (ticker ${l.ticker}). The name and ticker are fixed.`,
    `Utility it is launched on: ${l.title} (${l.category}).${l.utility_url ? ` Live at ${l.utility_url}.` : ""}`,
    `Pitch from the launcher: ${l.description}`,
    `Theme: ${l.theme || "the desk's call"}. Colour: ${l.color}. Site template: ${l.template}.`,
    `Token: supply 1,000,000,000 on a pump.fun curve, paired with ${l.pair === "evyn" ? "EVYN" : "SOL"}; creator fee paid by pump.fun to the EVERYNTH vault in full (nothing to the launcher); mechanics in order: ${mechanics}; dev buy ${l.dev_buy} SOL; holder gate ${Number(l.gate_balance).toLocaleString("en-US")} ${l.ticker} unlocks "${l.gate_unlocks}".`,
    `Links: ${[l.website && `site ${l.website}`, l.x && `X @${l.x}`, l.telegram && `Telegram ${l.telegram}`, l.github && `GitHub ${l.github}`].filter(Boolean).join(", ") || "none yet"}. Permalink: everynth.org/t/${l.slug ?? l.id}.`,
  ].join("\n");
}

const SVG_RULES = "complete, self-contained SVG: shapes, paths and gradients only; no <image>, <use>, filters, scripts or external references; font-family \"Geist\", sans-serif on every text element (the only font the renderer has; weights other than regular are synthesised); under 12 KB";
const identityAsk = (ownLogo: boolean) => [
  "Draw the identity for this launch. Start with the palette as a table with hex codes (built around the colour given) and the mood in one line.",
  ownLogo
    ? "The launcher uploaded their own logo, so draw no logo; match its colour."
    : `Then the LOGO, in a fenced block tagged svg: viewBox="0 0 512 512", a flat vector mark that reads at 32 px, no text beyond a single letter — ${SVG_RULES}.`,
  `Then the BANNER, in a fenced block tagged svg: viewBox="0 0 1500 500", a 3:1 hero in the palette with the project name, the ticker and one line of overlay copy as text, and the mark redrawn inside it — ${SVG_RULES}.`,
  "Nothing else: no image prompts, no commentary after the blocks.",
].join(" ");

const ASKS: Record<string, string> = {
  narrative: "Write the full narrative for this launch, with the token section built from the pair, the fee and the mechanics above, and the FAQ. First person plural: this is the team speaking.",
  site: `Write the token site copy for this launch: taglines, the hero, three value props, CTA labels, and the four sections. Match the theme and the template. End with one fenced block tagged json holding exactly {"tagline": string (under 60 characters), "intro": string (one or two sentences), "props": [{"title": string, "text": string} ×3], "cta": string (a button label, under 24 characters), "sections": [{"title": string, "body": string} ×4]} — the site renders from it.`,
};

/** What the token site reads from Quill's delivery; null when the delivery has no JSON block (an older run). */
export type SiteCopy = { tagline: string; intro: string; props: { title: string; text: string }[]; cta: string; sections: { title: string; body: string }[] };
export function siteCopy(output: string): SiteCopy | null {
  const m = /```json\s*\n([\s\S]*?)```/.exec(output);
  if (!m) return null;
  try {
    const j = JSON.parse(m[1]) as Partial<SiteCopy>;
    const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
    const items = <T,>(v: unknown, n: number, f: (x: Record<string, unknown>) => T) => (Array.isArray(v) ? v.slice(0, n).map((x) => f((x ?? {}) as Record<string, unknown>)) : []);
    return {
      tagline: s(j.tagline, 80), intro: s(j.intro, 400), cta: s(j.cta, 32),
      props: items(j.props, 3, (x) => ({ title: s(x.title, 60), text: s(x.text, 300) })),
      sections: items(j.sections, 4, (x) => ({ title: s(x.title, 80), body: s(x.body, 1500) })),
    };
  } catch { return null; }
}

/** Prism draws the logo (unless the launcher's own is set) and the banner; both land as PNG. */
export async function runIdentity(l: LaunchRow): Promise<{ logo: boolean; banner: boolean }> {
  const ownLogo = l.logo_source === "upload";
  const { output, model } = await ask("creative", [{ role: "user", content: `${briefFor(l)}\n\n${identityAsk(ownLogo)}` }]);
  const svgs = svgBlocks(output);
  const [logoSvg, bannerSvg] = ownLogo ? [null, svgs[0]] : [svgs[0], svgs[1]];
  const done = { logo: false, banner: false };
  // A drawing that will not render is reported, not stored; the other one still lands.
  if (logoSvg) { try { await putImage(l.id, "logo", "prism", await rasterize(logoSvg, LOGO)); done.logo = true; } catch { /* keep the previous logo */ } }
  if (bannerSvg) { try { await putImage(l.id, "banner", "prism", await rasterize(bannerSvg, BANNER)); done.banner = true; } catch { /* no banner this time */ } }
  await query(
    `insert into launch_deliverables (launch_id, kind, agent, model, output) values ($1, 'identity', 'creative', $2, $3)
     on conflict (launch_id, kind) do update set agent = excluded.agent, model = excluded.model, output = excluded.output, created_at = now()`,
    [l.id, model, stripSvg(output) || "Logo and banner drawn."],
  );
  return done;
}

export async function runDesk(l: LaunchRow): Promise<Deliverable[]> {
  const brief = briefFor(l);
  const results = await Promise.all(JOBS.map(async (j) => {
    if (j.kind === "identity") { await runIdentity(l); return j.kind; }
    const { output, model } = await ask(j.agent, [{ role: "user", content: `${brief}\n\n${ASKS[j.kind]}` }]);
    await query(
      `insert into launch_deliverables (launch_id, kind, agent, model, output) values ($1, $2, $3, $4, $5)
       on conflict (launch_id, kind) do update set agent = excluded.agent, model = excluded.model, output = excluded.output, created_at = now()`,
      [l.id, j.kind, j.agent, model, output],
    );
    return j.kind;
  }));
  return deliverables(l.id).then((rows) => rows.filter((r) => (results as string[]).includes(r.kind)));
}

export const deliverables = (launchId: string) =>
  query<Deliverable>(`select kind, agent, model, output, created_at::text as created_at from launch_deliverables where launch_id = $1`, [launchId]);
