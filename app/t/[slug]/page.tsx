import { notFound } from "next/navigation";
import { Site, siteData } from "@/components/sites";
import { getLaunch } from "@/lib/launches";

/**
 * The token's own site at its permalink: one of three templates, filled from the launch. It has
 * none of the app chrome on purpose — it is the project's page, not EVERYNTH's — and every link
 * out of it goes to the signed terms or the market, so nothing is claimed here that was not signed.
 */
export async function generateMetadata({ params }: PageProps<"/t/[slug]">) {
  const l = await getLaunch((await params).slug);
  if (!l) return { title: "Not found" };
  return {
    title: `${l.name} ($${l.ticker})`,
    description: l.description,
    openGraph: { title: `${l.name} ($${l.ticker})`, description: l.description, images: l.has_cover ? [`/api/products/${l.product_id}/cover`] : undefined },
  };
}

export default async function TokenSite({ params }: PageProps<"/t/[slug]">) {
  const l = await getLaunch((await params).slug);
  if (!l) notFound();
  return <Site d={siteData(l)} />;
}
