import { cookies } from "next/headers";
import { createSession, SESSION_COOKIE, SESSION_TTL_S, sessionSecret, verifyLogin } from "@/lib/auth";
import { allow, callerKey, tooMany } from "@/lib/limit";

// POST = sign in with a wallet signature, DELETE = sign out.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { wallet, issuedAt, signature } = body ?? {};
  if (typeof wallet !== "string" || typeof issuedAt !== "number" || typeof signature !== "string") {
    return Response.json({ error: "wallet, issuedAt and signature are required" }, { status: 400 });
  }
  if (!(await allow("signIn", callerKey(request, wallet)))) return tooMany("signIn");
  const host = request.headers.get("host") ?? "";
  if (!verifyLogin(host, wallet, issuedAt, signature)) {
    return Response.json({ error: "invalid or expired signature" }, { status: 401 });
  }
  (await cookies()).set(SESSION_COOKIE, createSession(wallet, sessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_S,
  });
  return Response.json({ wallet });
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
