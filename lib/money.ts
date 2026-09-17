import { FEE_BPS, MAX_PRICE_MICRO, USDC_DECIMALS } from "./config.ts";

// "12.5" -> 12500000 micro USDC. Returns null on anything that is not a plain positive decimal.
export function parseUsdc(input: string): number | null {
  const m = /^(\d{1,7})(?:\.(\d{1,6}))?$/.exec(input.trim());
  if (!m) return null;
  const micro = Number(m[1]) * 10 ** USDC_DECIMALS + Number((m[2] ?? "").padEnd(USDC_DECIMALS, "0"));
  return micro > 0 && micro <= MAX_PRICE_MICRO ? micro : null;
}

export function formatUsdc(micro: number): string {
  return (micro / 10 ** USDC_DECIMALS).toLocaleString("en-US", { maximumFractionDigits: USDC_DECIMALS });
}

// Buyer pays `price`; the fee comes out of the creator's share. fee + creatorAmount === price always.
export function splitPrice(price: number): { fee: number; creatorAmount: number } {
  const fee = Math.floor((price * FEE_BPS) / 10_000);
  return { fee, creatorAmount: price - fee };
}
