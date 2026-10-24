import { notFound } from "next/navigation";
import { Glow } from "@/components/sites/glow";
import { loadSite, siteMetadata } from "./load";

/**
 * The token's terminal at its permalink: chart, trades, swap, curve and holders, read from the
 * chain. The website (the landing page) is one click away, at /t/<slug>/site. Neither carries the
 * app chrome: they are the project's pages, not EVERYNTH's, and every link out goes to the signed
 * terms, the market or pump.fun, so nothing is claimed that was not signed or read off the chain.
 */
export async function generateMetadata({ params }: PageProps<"/t/[slug]">) {
  const s = await loadSite((await params).slug);
  return s ? siteMetadata(s.l, "terminal") : { title: "Not found" };
}

export default async function TokenTerminal({ params }: PageProps<"/t/[slug]">) {
  const s = await loadSite((await params).slug);
  if (!s) notFound();
  return <Glow d={s.d} />;
}
