// Safe to import from both browser and server: constants only, no secrets.
export const FEE_BPS = 500; // platform fee, 5% of the price, taken out of the creator's share
export const USDC_DECIMALS = 6;
export const MAX_PRICE_MICRO = 1_000_000 * 10 ** USDC_DECIMALS; // keeps amounts inside Number's safe range
// ponytail: ciphertext lives in a Postgres bytea and rides through the API route, so stay under
// Vercel's 4.5 MB request limit. Move to direct-to-storage signed uploads when bigger files matter.
export const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;
export const CATEGORIES = ["AI Agent", "API", "Dataset", "Tool", "Research", "Service", "Community"] as const;
export const KINDS = ["file", "secret"] as const;

export const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // devnet USDC
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
