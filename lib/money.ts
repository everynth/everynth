import { FEE_BPS, MAX_PRICE_LAMPORTS, MIN_PRICE_LAMPORTS, SOL_DECIMALS } from "./config.ts";

// "1.25" -> 1250000000 lamports. Returns null on anything that is not a plain decimal inside the allowed range.
export function parseSol(input: string): number | null {
  const m = /^(\d{1,7})(?:\.(\d{1,9}))?$/.exec(input.trim());
  if (!m) return null;
  const lamports = Number(m[1]) * 10 ** SOL_DECIMALS + Number((m[2] ?? "").padEnd(SOL_DECIMALS, "0"));
  return lamports >= MIN_PRICE_LAMPORTS && lamports <= MAX_PRICE_LAMPORTS ? lamports : null;
}

export function formatSol(lamports: number): string {
  return (lamports / 10 ** SOL_DECIMALS).toLocaleString("en-US", { maximumFractionDigits: SOL_DECIMALS });
}

// Buyer pays `price`; the fee comes out of the creator's share. fee + creatorAmount === price always.
export function splitPrice(price: number): { fee: number; creatorAmount: number } {
  const fee = Math.floor((price * FEE_BPS) / 10_000);
  return { fee, creatorAmount: price - fee };
}
