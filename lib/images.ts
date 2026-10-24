// A launch's pictures: the logo pump.fun and wallets show, and the banner on the token site. Either
// uploaded by the launcher or drawn by Prism as SVG, both kept as PNG — pump.fun does not render SVG.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { query } from "./db.ts";

// The server has no fonts (Vercel's functions ship none), so SVG text would render as boxes. One
// font travels with the code — read with a literal path, so the file tracer bundles it — and
// fontconfig is pointed at it before the first render.
let fontsReady = false;
function fonts() {
  if (fontsReady) return;
  fontsReady = true;
  const dir = path.join(tmpdir(), "everynth-fonts");
  mkdirSync(dir, { recursive: true });
  const ttf = path.join(dir, "Geist-Regular.ttf");
  if (!existsSync(ttf)) writeFileSync(ttf, readFileSync(path.join(process.cwd(), "fonts", "Geist-Regular.ttf")));
  const conf = path.join(dir, "fonts.conf");
  writeFileSync(conf, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${dir}</dir><cachedir>${path.join(dir, "cache")}</cachedir><alias><family>sans-serif</family><prefer><family>Geist</family></prefer></alias></fontconfig>`);
  process.env.FONTCONFIG_FILE = conf;
}

export const LOGO = { w: 512, h: 512 };
export const BANNER = { w: 1500, h: 500 };
export type ImageKind = "logo" | "banner";
export type ImageSource = "upload" | "prism";
const MAX_SVG = 64_000;

/** Every fenced ```svg block in an agent's answer, in order. */
export const svgBlocks = (md: string) => [...md.matchAll(/```svg\s*\n([\s\S]*?)```/g)].map((m) => m[1].trim());
/** The same answer without the SVG source, for reading. */
export const stripSvg = (md: string) => md.replace(/```svg\s*\n[\s\S]*?```/g, "").replace(/\n{3,}/g, "\n\n").trim();

/** An SVG from a model, rendered to a PNG of the given size. Refuses anything that could reach outside the file. */
export async function rasterize(svg: string, size: { w: number; h: number }): Promise<Buffer> {
  if (svg.length > MAX_SVG) throw new Error("the SVG is too large");
  if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(svg)) throw new Error("not an SVG");
  if (/<(script|image|foreignObject|use|iframe)\b|href\s*=\s*["']\s*(https?:|\/\/|file:)/i.test(svg)) throw new Error("the SVG references something outside itself");
  fonts();
  return sharp(Buffer.from(svg), { density: 192 }).resize(size.w, size.h, { fit: "cover" }).png().toBuffer();
}

/** A launcher's upload, cropped to size and re-encoded as PNG. */
export const normalize = (file: Buffer, size: { w: number; h: number }) =>
  sharp(file, { limitInputPixels: 40e6 }).rotate().resize(size.w, size.h, { fit: "cover" }).png().toBuffer();

/** The mark a launch starts with: its initial on the project colour. */
export const markSvg = (name: string, color: string) => {
  const initial = (name.trim()[0] ?? "◆").toUpperCase().replace(/[<>&]/g, "");
  const c = /^#[0-9a-f]{6}$/i.test(color) ? color : "#79d2f2";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".35"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="#0c0d11"/>
  <rect x="24" y="24" width="464" height="464" rx="96" fill="url(#g)"/>
  <text x="256" y="256" dy=".36em" text-anchor="middle" font-family="Geist, sans-serif" font-size="280" font-weight="700" fill="rgba(0,0,0,.72)">${initial}</text>
</svg>`;
};

export const getImage = (launchId: string, kind: ImageKind) =>
  query<{ data: Buffer | Uint8Array; source: ImageSource }>(`select data, source from launch_images where launch_id = $1 and kind = $2`, [launchId, kind]).then((r) => r[0] ?? null);

export const putImage = (launchId: string, kind: ImageKind, source: ImageSource, data: Buffer) =>
  query(
    `insert into launch_images (launch_id, kind, source, data) values ($1, $2, $3, $4)
     on conflict (launch_id, kind) do update set source = excluded.source, data = excluded.data, created_at = now()`,
    [launchId, kind, source, data],
  );
