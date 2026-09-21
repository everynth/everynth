import Link from "next/link";
import { Providers } from "@/components/providers";
import { SignIn } from "@/components/sign-in";
import { isAdmin, sessionWallet } from "@/lib/session";
import { NavLinks } from "./nav-links";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const wallet = await sessionWallet();
  return (
    <Providers>
      <header className="top">
        <div className="wrap flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/" className="brand">
            <span className="chrome">EVERYNTH</span>
          </Link>
          <NavLinks signedIn={!!wallet} admin={isAdmin(wallet)} />
          <div className="ml-auto">
            <SignIn sessionWallet={wallet} />
          </div>
        </div>
      </header>
      <main className="wrap flex-1 py-10">{children}</main>
      <footer className="foot">
        <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="chrome font-mono text-xs tracking-widest">EVERYNTH</span>
          <Link href="/terms" className="navlink">Terms</Link>
          <Link href="/developers" className="navlink">For developers</Link>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-widest opacity-50">non-custodial · no program · encrypted in your browser</span>
        </div>
      </footer>
    </Providers>
  );
}
