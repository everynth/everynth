import { notFound } from "next/navigation";
import { DOCS, docBySlug } from "@/lib/docs";
import { CONTENT } from "../content";

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">) {
  const doc = docBySlug((await params).slug);
  return { title: doc ? `${doc.title} — EVERYNTH docs` : "EVERYNTH docs", description: doc?.summary };
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const doc = docBySlug(slug);
  const Body = CONTENT[slug];
  if (!doc || !Body) notFound();
  const i = DOCS.findIndex((d) => d.slug === slug);
  const next = DOCS[i + 1];
  return (
    <article>
      <p className="font-mono text-xs uppercase tracking-widest opacity-60">Docs</p>
      <h1>{doc.title}</h1>
      <p className="lead">{doc.summary}</p>
      <Body />
      {next && (
        <p className="mt-12 border-t border-foreground/10 pt-5 text-sm">
          Next: <a href={`/docs/${next.slug}`} className="underline">{next.title} →</a>
        </p>
      )}
    </article>
  );
}
