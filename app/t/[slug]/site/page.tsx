import { notFound } from "next/navigation";
import { Landing } from "@/components/sites/landing";
import { loadSite, siteMetadata } from "../load";

/** The token's website: the landing page in the look the launcher picked, filled by the desk. */
export async function generateMetadata({ params }: PageProps<"/t/[slug]/site">) {
  const s = await loadSite((await params).slug);
  return s ? siteMetadata(s.l, "website") : { title: "Not found" };
}

export default async function TokenWebsite({ params }: PageProps<"/t/[slug]/site">) {
  const s = await loadSite((await params).slug);
  if (!s) notFound();
  return <Landing d={s.d} />;
}
