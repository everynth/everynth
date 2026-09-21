import Link from "next/link";
import { Providers } from "@/components/providers";
import { SignIn } from "@/components/sign-in";
import { isAdmin, sessionWallet } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const wallet = await sessionWallet();
  return (
    <Providers>
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/" className="font-mono text-sm font-semibold tracking-widest">
            EVERYNTH
          </Link>
          <nav className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-sm opacity-80">
            <Link href="/">Market</Link>
            <Link href="/launch">Launch</Link>
            {wallet && <Link href="/purchases">Purchases</Link>}
            {wallet && <Link href="/dashboard">Dashboard</Link>}
            {isAdmin(wallet) && <Link href="/admin">Admin</Link>}
          </nav>
          <SignIn sessionWallet={wallet} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
      <footer className="mx-auto flex w-full max-w-5xl gap-5 px-6 py-6 text-xs opacity-60">
        <span>EVERYNTH — The Private Commerce Layer</span>
        <Link href="/terms">Terms</Link>
        <Link href="/developers">For developers</Link>
      </footer>
    </Providers>
  );
}
