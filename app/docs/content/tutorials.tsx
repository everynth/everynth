import Link from "next/link";
import type { ComponentType } from "react";
import { TutorialPlayer } from "@/components/tutorial-player";
import { tutorialBySlug } from "@/lib/tutorials";
import { H2, Note } from "../ui";

// Every tutorial page is the same page with different contents, so build it from the registry
// instead of writing it out again each time. A new tutorial is an entry in lib/tutorials.ts.
export function tutorialPage(slug: string): ComponentType {
  function TutorialBody() {
    const t = tutorialBySlug(slug);
    if (!t) return null;

    return (
      <>
        {t.video ? (
          <TutorialPlayer src={t.video.src} poster={t.video.poster} chapters={t.chapters} />
        ) : (
          <Note>
            <p>
              <strong>Not recorded yet.</strong> The steps below are complete and current — the video follows once the
              feature itself ships. Everything in <Link href="/docs">the rest of the docs</Link> already describes how
              it works today.
            </p>
          </Note>
        )}

        {t.steps.length > 0 && (
          <>
            <H2 id="steps">Step by step</H2>
            <ol>
              {t.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </>
        )}

        {t.notes && t.notes.length > 0 && (
          <>
            <H2 id="watch-out">Worth knowing</H2>
            {t.notes.map((n) => (
              <Note key={n} kind="warn">
                <p>{n}</p>
              </Note>
            ))}
          </>
        )}
      </>
    );
  }
  TutorialBody.displayName = `Tutorial(${slug})`;
  return TutorialBody;
}
