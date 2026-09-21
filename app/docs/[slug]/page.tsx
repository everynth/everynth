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
    <article className="docs-rise">
      <p className="docs-kicker">Docs · {String(i + 1).padStart(2, "0")}</p>
      <h1 className="chrome shimmer">{doc.title}</h1>
      <p className="lead">{doc.summary}</p>
      <Body />
      {next && (
        <a href={`/docs/${next.slug}`} className="docs-next no-underline">
          <span className="docs-kicker">Next</span>
          <span className="docs-next-title">{next.title} →</span>
        </a>
      )}
    </article>
  );
}
