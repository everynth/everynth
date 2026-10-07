import Link from "next/link";
import { Providers } from "@/components/providers";
import { SignIn } from "@/components/sign-in";
import { isAdmin, sessionWallet } from "@/lib/session";
import { SOCIALS } from "@/lib/site";
import { NavLinks } from "./nav-links";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const wallet = await sessionWallet();
  return (
    <Providers>
      <header className="top">
        <div className="wrap-wide flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link href="/" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element -- static mark, no layout shift to optimise away */}
            <img src="/logo.png" alt="" width={22} height={22} className="brand-mark" />
            <span className="chrome">EVERYNTH</span>
          </Link>
          <div className="tabs">
            <NavLinks signedIn={!!wallet} admin={isAdmin(wallet)} />
          </div>
          <form method="get" action="/" className="ml-auto hidden md:block">
            <input name="q" placeholder="Search" aria-label="Search products" className="field" style={{ width: 240, borderRadius: 999 }} />
          </form>
          <div className="ml-auto md:ml-0">
            <SignIn sessionWallet={wallet} />
          </div>
        </div>
      </header>
      <main className="wrap-wide flex-1 py-6">{children}</main>
      <footer className="foot">
        <div className="wrap-wide flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- static mark */}
          <img src="/logo.png" alt="" width={16} height={16} className="brand-mark brand-mark-sm" />
          <span className="chrome font-mono text-xs tracking-widest">EVERYNTH</span>
          <Link href="/terms" className="navlink">Terms</Link>
          <Link href="/developers" className="navlink">For developers</Link>
          {SOCIALS.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer noopener" className="navlink">{s.name} ↗</a>
          ))}
          <span className="ml-auto font-mono text-[11px] uppercase tracking-widest opacity-50">non-custodial · no program · encrypted in your browser</span>
        </div>
      </footer>
    </Providers>
  );
}
