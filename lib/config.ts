// Safe to import from both browser and server: constants only, no secrets.
export const FEE_BPS = 500; // platform fee, 5% of the price, taken out of the creator's share
export const SOL_DECIMALS = 9;
// Prices are in lamports. Floor keeps the 5% fee above rent-exempt minimum (~0.0009 SOL), otherwise
// a transfer into a never-used treasury/creator wallet is rejected by the runtime.
export const MIN_PRICE_LAMPORTS = 0.02 * 10 ** SOL_DECIMALS;
export const MAX_PRICE_LAMPORTS = 1_000_000 * 10 ** SOL_DECIMALS; // keeps amounts inside Number's safe range
// Files go browser -> Vercel Blob directly (encrypted first). ponytail: the whole file is encrypted
// in memory in one go, so keep this well under what a phone browser tolerates; chunk it if that matters.
export const MAX_PAYLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_SECRET_BYTES = 64 * 1024; // secret text is stored inline in the database
export const MAX_COVER_BYTES = 1024 * 1024; // cover image, stored inline as bytea
export const MAX_REVIEW_BODY = 500; // a review is a verdict, not an essay
// Executables and installers are refused by file name. Content is encrypted in the browser, so this
// is the only check the server can make; archives are not inspected.
export const BLOCKED_EXTENSIONS = /\.(exe|msi|bat|cmd|com|scr|pif|vbs|vbe|ps1|dll|dmg|pkg|app|apk|deb|rpm|jar|lnk)$/i;
export const CATEGORIES = ["AI Agent", "API", "Dataset", "Tool", "Research", "Service", "Community"] as const;
export const KINDS = ["file", "secret", "github"] as const;

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
