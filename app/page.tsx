import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE, sessionSecret } from "@/lib/auth";
import { SignIn } from "./sign-in";

export default async function Home() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const sessionWallet = readSession(token, sessionSecret());

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-24">
      <p className="font-mono text-sm tracking-widest">EVERYNTH</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">The Private Commerce Layer.</h1>
      <p className="max-w-xl text-lg opacity-70">
        Build it. Launch it. Monetize it. Privately. Launch AI agents, APIs, datasets, tools and digital services,
        and get paid in USDC.
      </p>
      <SignIn sessionWallet={sessionWallet} />
    </main>
  );
}
