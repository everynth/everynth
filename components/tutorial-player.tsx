"use client";

import { useRef, useState } from "react";
import type { Chapter } from "@/lib/tutorials";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// The video plus its chapters. Clicking a chapter jumps there and starts playing, so a reader
// looking for one step does not have to scrub for it.
export function TutorialPlayer({ src, poster, chapters = [] }: { src: string; poster: string; chapters?: Chapter[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const [at, setAt] = useState(0);

  function jump(seconds: number) {
    const el = video.current;
    if (!el) return;
    el.currentTime = seconds;
    void el.play().catch(() => {}); // autoplay can be refused; the seek still happened
  }

  const current = chapters.reduce((found, c, i) => (at + 0.25 >= c.at ? i : found), -1);

  return (
    <figure className="tut">
      <video
        ref={video}
        src={src}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        className="tut-video"
        onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
      />
      {chapters.length > 0 && (
        <ol className="tut-chapters not-list">
          {chapters.map((c, i) => (
            <li key={c.at}>
              <button type="button" onClick={() => jump(c.at)} className={`tut-chapter${i === current ? " is-current" : ""}`}>
                <b>{clock(c.at)}</b>
                <span>{c.label}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}
