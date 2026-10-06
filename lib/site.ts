// Two front doors onto one deployment:
//   SITE — everynth.org: the landing page and the docs, what a stranger should meet first.
//   APP  — app.everynth.org: the market, launching, purchases, dashboards.
// Both hosts answer every path, so old links keep working; these constants only decide which
// address we hand out ourselves.
export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everynth.org";
export const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.everynth.org";
