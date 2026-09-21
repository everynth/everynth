// Safe to import from both browser and server: constants only, no secrets.
export const FEE_BPS = 500; // platform fee, 5% of the price, taken out of the creator's share
export const SOL_DECIMALS = 9;
// Prices are in lamports. Floor keeps the 5% fee above rent-exempt minimum (~0.0009 SOL), otherwise
// a transfer into a never-used treasury/creator wallet is rejected by the runtime.
export const MIN_PRICE_LAMPORTS = 0.02 * 10 ** SOL_DECIMALS;
export const MAX_PRICE_LAMPORTS = 1_000_000 * 10 ** SOL_DECIMALS; // keeps amounts inside Number's safe range
// ponytail: ciphertext lives in a Postgres bytea and rides through the API route, so stay under
// Vercel's 4.5 MB request limit. Move to direct-to-storage signed uploads when bigger files matter.
export const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_COVER_BYTES = 1024 * 1024; // cover image, stored inline as bytea
export const CATEGORIES = ["AI Agent", "API", "Dataset", "Tool", "Research", "Service", "Community"] as const;
export const KINDS = ["file", "secret"] as const;

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
