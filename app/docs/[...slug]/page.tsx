import { notFound } from "next/navigation";
import { DOCS, docBySlug, groupOf } from "@/lib/docs";
import { CONTENT } from "../content";

// A catch-all so a permalink can be nested: /docs/payments stays flat, /docs/tutorial/launch-product
// says which launch it teaches. The slug is simply the path after /docs.
export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug.split("/") }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[...slug]">) {
  const doc = docBySlug((await params).slug.join("/"));
  return { title: doc ? `${doc.title} — EVERYNTH docs` : "EVERYNTH docs", description: doc?.summary };
}

export default async function DocPage({ params }: PageProps<"/docs/[...slug]">) {
  const slug = (await params).slug.join("/");
  const doc = docBySlug(slug);
  const Body = CONTENT[slug];
  if (!doc || !Body) notFound();
  const i = DOCS.findIndex((d) => d.slug === slug);
  const next = DOCS[i + 1];
  return (
    <article className="docs-rise">
      <p className="docs-kicker">{groupOf(slug)}</p>
      <h1 className="docs-title">{doc.title}</h1>
      <p className="lead">{doc.summary}</p>
      <hr className="docs-rule" />
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
