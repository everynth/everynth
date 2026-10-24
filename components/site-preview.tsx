import type { TemplateId } from "@/lib/launchpad";

export type SiteProps = {
  name: string; ticker: string; description: string; color: string; template: TemplateId;
  website?: string; x?: string; telegram?: string; github?: string; utility?: string;
  /** Thumbnail by default; `lg` for the full-width preview. */
  size?: "sm" | "lg";
};

/**
 * A miniature of the landing page at /t/<slug>, drawn from the brief: banner, avatar, name, pitch,
 * the live numbers and the sections, in one of the three looks (components/sites/landing). Pure
 * markup, sized in em so the same component is a thumbnail in the template picker and the full
 * preview in the agents step. Everything in it is placeholder except what the launcher typed.
 */
export function SitePreview(p: SiteProps) {
  const name = p.name.trim() || "Your project";
  const ticker = p.ticker || "TICKER";
  const pitch = p.description.trim() || "What the token is for, in a sentence the desk expands into the story.";
  const links = [p.x && "X", p.telegram && "Telegram", p.github && "GitHub", p.website && "App"].filter(Boolean) as string[];
  const style = { "--accent": p.color } as React.CSSProperties;
  const cls = `sp sp-${p.template} sp-${p.size ?? "sm"}`;
  const stats = ["market cap", "holders", "24h volume", "bonding curve"];

  return (
    <div className={cls} style={style} aria-hidden="true">
      <div className="sp-nav"><b>${ticker}</b><span>Chart · Story · Utility · Updates</span><span className="sp-btn">Buy ${ticker}</span></div>
      <div className="sp-banner" />
      <div className="sp-hero sp-hero-1">
        <div><small className="sp-k">● live on pump.fun · paired with EVYN</small><b>{name}</b><p>{pitch}</p><span className="sp-pill">CA · after launch</span></div>
        <span className="sp-photo">{name[0]}</span>
      </div>
      <div className="sp-stats">{stats.map((s) => <span key={s}>{s}</span>)}</div>
      <div className="sp-cards"><div>01<br />Story</div><div>02<br />{p.utility ?? "Utility"}</div><div>03<br />From the desk</div></div>
      <div className="sp-foot"><span className="sp-dim">{links.length ? links.join(" · ") : "links go here"}</span><span className="sp-dim">built by the desk</span></div>
    </div>
  );
}
