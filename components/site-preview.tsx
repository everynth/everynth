import type { TemplateId } from "@/lib/launchpad";

export type SiteProps = {
  name: string; ticker: string; description: string; color: string; template: TemplateId;
  website?: string; x?: string; telegram?: string; github?: string; utility?: string;
  /** Thumbnail by default; `lg` for the full-width preview. */
  size?: "sm" | "lg";
};

/**
 * A miniature of the site at /t/<slug>, drawn from the brief: name, ticker, pitch and colour on
 * one of three shapes (components/sites). Pure markup, sized in em so the same component is a
 * thumbnail in the template picker and the full preview in the agents step. Everything in it is
 * placeholder except what the launcher typed; the desk replaces the rest.
 */
export function SitePreview(p: SiteProps) {
  const name = p.name.trim() || "Your project";
  const ticker = p.ticker || "TICKER";
  const pitch = p.description.trim() || "What the token is for, in a sentence the desk expands into the story.";
  const links = [p.x && "X", p.telegram && "Telegram", p.github && "GitHub", p.website && "App"].filter(Boolean) as string[];
  const style = { "--accent": p.color } as React.CSSProperties;
  const cls = `sp sp-${p.template} sp-${p.size ?? "sm"}`;
  const stats = ["market cap", "holders", "24h volume", "contract"];

  if (p.template === "terminal") {
    return (
      <div className={cls} style={style} aria-hidden="true">
        <div className="sp-bar"><i /><i /><i /><span>~/{ticker.toLowerCase()}</span><b>${ticker}</b></div>
        <div className="sp-con">
          <p className="sp-cmd">$ {ticker.toLowerCase()} --about</p>
          <div className="sp-kv"><span>name</span><b>{name}</b><span>backs</span><b>{p.utility || "the utility"}</b><span>contract</span><b>after launch</b></div>
          <p className="sp-line">{pitch}</p>
          <p className="sp-cmd">$ {ticker.toLowerCase()} --market</p>
          <div className="sp-stats sp-stats-t">{stats.map((s) => <span key={s}>{s}</span>)}</div>
          <p className="sp-line sp-dim">{links.length ? links.map((l) => `[${l.toLowerCase()}]`).join(" ") : "[links]"} [terms] [everynth]</p>
        </div>
      </div>
    );
  }

  if (p.template === "brutal") {
    return (
      <div className={cls} style={style} aria-hidden="true">
        <div className="sp-nav sp-nav-b"><b>${ticker}</b><span>STORY · UTILITY · TERMS</span><span className="sp-btn">BUY</span></div>
        <div className="sp-hero sp-hero-b">
          <div><b>{name}</b><p>{pitch}</p><span className="sp-pill">CA: AFTER LAUNCH</span></div>
          <span className="sp-photo">{name[0]}</span>
        </div>
        <div className="sp-stats sp-stats-b">{stats.map((s) => <span key={s}>{s}</span>)}</div>
        <div className="sp-foot sp-foot-b"><span>{links.length ? links.join(" · ") : "links"}</span><span>EVERYNTH</span></div>
      </div>
    );
  }

  return (
    <div className={cls} style={style} aria-hidden="true">
      <div className="sp-nav"><b>${ticker}</b><span>Story · Utility · Terms · Buy</span><span className="sp-btn">Buy ${ticker}</span></div>
      <div className="sp-hero sp-hero-1">
        <div><small className="sp-k">● launching on EVERYNTH</small><b>{name}</b><p>{pitch}</p><span className="sp-pill">CA · after launch</span></div>
        <span className="sp-photo">{name[0]}</span>
      </div>
      <div className="sp-stats">{stats.map((s) => <span key={s}>{s}</span>)}</div>
      <div className="sp-cards"><div>01<br />What it is</div><div>02<br />Backed by</div><div>03<br />Why hold</div></div>
      <div className="sp-foot"><span className="sp-dim">{links.length ? links.join(" · ") : "links go here"}</span><span className="sp-dim">built by the desk</span></div>
    </div>
  );
}
