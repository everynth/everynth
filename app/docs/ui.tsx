import type { ReactNode } from "react";

// Small building blocks for doc pages. Headings carry a permalink anchor.

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="group scroll-mt-24">
      {children}
      <a href={`#${id}`} aria-label="Permalink" className="ml-2 opacity-0 transition-opacity group-hover:opacity-50">
        #
      </a>
    </h2>
  );
}

export function H3({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="group scroll-mt-24">
      {children}
      <a href={`#${id}`} aria-label="Permalink" className="ml-2 opacity-0 transition-opacity group-hover:opacity-50">
        #
      </a>
    </h3>
  );
}

export function Code({ children, lang }: { children: string; lang?: string }) {
  return (
    <pre data-lang={lang}>
      <code>{children}</code>
    </pre>
  );
}

export function Note({ kind = "note", children }: { kind?: "note" | "warn"; children: ReactNode }) {
  return (
    <aside className={`callout callout-${kind}`} role="note">
      {children}
    </aside>
  );
}

// Route table row helper for the API reference.
export function Route({ method, path, auth, children }: { method: string; path: string; auth: string; children: ReactNode }) {
  return (
    <section className="route">
      <p className="route-head">
        <span className="method">{method}</span>
        <code>{path}</code>
        <span className="auth">{auth}</span>
      </p>
      {children}
    </section>
  );
}
