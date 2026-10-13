import type { TemplateId } from "@/lib/launchpad";

export type SiteProps = {
  name: string; ticker: string; description: string; color: string; template: TemplateId;
  website?: string; x?: string; telegram?: string; github?: string; utility?: string;
  /** Thumbnail by default; `lg` for the full-width preview. */
  size?: "sm" | "lg";
};

/**
 * A miniature of the site the desk will publish at the permalink, drawn from the brief: the
 * project name, ticker, pitch and colour on one of three shapes. Pure markup, sized in em so the
 * same component is a thumbnail in the template picker and the full preview in the agents step.
 * Everything in it is placeholder except what the launcher typed; the desk replaces the rest.
 */
export function SitePreview(p: SiteProps) {
  const name = p.name.trim() || "Your project";
  const ticker = p.ticker || "TICKER";
  const pitch = p.description.trim() || "What the token is for, in a sentence the desk expands into the story.";
  const links = [p.x && "X", p.telegram && "Telegram", p.github && "GitHub", p.website && "App"].filter(Boolean) as string[];
  const style = { "--accent": p.color } as React.CSSProperties;
  const cls = `sp sp-${p.template} sp-${p.size ?? "sm"}`;

  if (p.template === "terminal") {
    return (
      <div className={cls} style={style} aria-hidden="true">
        <div className="sp-bar"><i /><i /><i /><span>~/{ticker.toLowerCase()}</span><b>live</b></div>
        <div className="sp-con">
          <p className="sp-cmd">$ {ticker.toLowerCase()} --status</p>
          <div className="sp-kv"><span>name</span><b>{name}</b><span>ticker</span><b>${ticker}</b><span>backs</span><b>{p.utility || "the utility"}</b><span>contract</span><b>after launch</b></div>
          <svg viewBox="0 0 200 48" className="sp-chart"><path d="M0 40 C20 38 30 30 45 32 S70 20 90 22 S120 10 140 14 S175 6 200 4" /></svg>
          <p className="sp-cmd">$ {ticker.toLowerCase()} --log</p>
          <p className="sp-line">01 · {pitch}</p>
          <p className="sp-line">02 · terms frozen · mechanics stacked · holders unlock {p.utility || "the utility"}</p>
          <p className="sp-line sp-dim">{links.length ? links.join(" · ") : "links go here"}</p>
        </div>
      </div>
    );
  }

  if (p.template === "gallery") {
    return (
      <div className={cls} style={style} aria-hidden="true">
        <div className="sp-banner"><span className="sp-logo">{name[0]}</span><b>{name}</b><small>${ticker}</small></div>
        <div className="sp-grid">
          <div><b>Unlocks</b><span>{p.utility || "the utility"}</span></div>
          <div><b>Story</b><span>{pitch}</span></div>
          <div><b>Mechanics</b><span>what the fee does</span></div>
          <div><b>Holders</b><span>the gate, the forum</span></div>
        </div>
        <div className="sp-foot"><span className="sp-btn">Buy ${ticker}</span><span className="sp-dim">{links.length ? links.join(" · ") : "links"}</span></div>
      </div>
    );
  }

  return (
    <div className={cls} style={style} aria-hidden="true">
      <div className="sp-nav"><b>${ticker}</b><span>Story · Milestones · Updates</span><span className="sp-btn">Buy ${ticker}</span></div>
      <div className="sp-hero">
        <span className="sp-logo">{name[0]}</span>
        <b>{name}</b>
        <p>{pitch}</p>
        <span className="sp-pill">contract address · after launch</span>
      </div>
      <div className="sp-stats"><span>market cap</span><span>holders</span><span>24h volume</span><span>curve</span></div>
      <div className="sp-cards"><div>01<br />The utility</div><div>02<br />The terms</div><div>03<br />Why hold</div></div>
      <div className="sp-foot"><span className="sp-dim">{links.length ? links.join(" · ") : "links go here"}</span><span className="sp-dim">built by the desk</span></div>
    </div>
  );
}
