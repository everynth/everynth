import { CATEGORIES, MAX_COVER_BYTES } from "./config.ts";
import { parseSol } from "./money.ts";

export type Fields = { title: string; description: string; category: string; price: number };

export const formText = (form: FormData, name: string) =>
  typeof form.get(name) === "string" ? (form.get(name) as string).trim() : "";

// Shared by create and edit. Returns the clean fields or an error message.
export function parseFields(form: FormData): Fields | string {
  const title = formText(form, "title");
  const description = formText(form, "description");
  const category = formText(form, "category");
  const price = parseSol(formText(form, "price"));
  if (title.length < 3 || title.length > 80) return "title must be 3-80 characters";
  if (description.length < 10 || description.length > 4000) return "description must be 10-4000 characters";
  if (!(CATEGORIES as readonly string[]).includes(category)) return "unknown category";
  if (price === null) return "price must be between 0.02 and 1,000,000 SOL, max 9 decimals";
  return { title, description, category, price };
}

// Optional cover image: undefined when none was sent, error string when invalid.
export async function parseCover(form: FormData): Promise<{ bytes: Buffer; type: string } | undefined | string> {
  const cover = form.get("cover");
  if (!(cover instanceof Blob) || cover.size === 0) return undefined;
  if (!/^image\/(png|jpeg|webp|gif)$/.test(cover.type)) return "cover must be a PNG, JPEG, WebP or GIF";
  if (cover.size > MAX_COVER_BYTES) return "cover must be 1 MB or smaller";
  return { bytes: Buffer.from(await cover.arrayBuffer()), type: cover.type };
}
