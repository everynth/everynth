import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE, sessionSecret } from "./auth.ts";

// Wallet address of the signed-in user, or null.
export async function sessionWallet(): Promise<string | null> {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value, sessionSecret());
}

export function isAdmin(wallet: string | null): boolean {
  return !!wallet && (process.env.ADMIN_WALLETS ?? "").split(",").includes(wallet);
}
