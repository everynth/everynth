import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM + data files it loads relative to itself; keep it out of the bundle. The Pump
  // SDK and Anchor must NOT be listed: their ESM builds carry no "type": "module", so Node on Vercel
  // reads them as CommonJS and the whole page 500s ("Cannot use import statement outside a module").
  // Bundled, Turbopack takes the ESM build on its own terms.
  serverExternalPackages: ["@electric-sql/pglite"],

  // Page-data collection forks one worker per core (15 here) and each loads the server graph; on a
  // laptop with a browser open that is more memory than the machine has. Three is plenty.
  experimental: { cpus: 3 },

  // everynth.org is the pitch, app.everynth.org is the product. Both hosts serve the same
  // deployment; only the front door differs, so no link anywhere has to break.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: [{ type: "host", value: "everynth.org" }], destination: "/landing.html" },
        { source: "/", has: [{ type: "host", value: "www.everynth.org" }], destination: "/landing.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  // "Launch" meant two different things once the launchpad was announced. The permalinks now say
  // which: /launch/product lists something for sale, /launch/token is the (unbuilt) token side.
  // The bare /launch is kept forever so older links, posts and screenshots still land correctly.
  async redirects() {
    return [
      { source: "/launch", destination: "/launch/product", permanent: true },
      { source: "/launch/token", destination: "/launchpad", permanent: true },
      // The tutorials moved under /docs/tutorial/ for the same reason, a day after they went up.
      { source: "/docs/tutorial-launch", destination: "/docs/tutorial/launch-product", permanent: true },
      { source: "/docs/tutorial-buying", destination: "/docs/tutorial/buy-and-unlock", permanent: true },
      { source: "/docs/tutorial-manage", destination: "/docs/tutorial/edit-and-remove", permanent: true },
      { source: "/docs/tutorial-chat", destination: "/docs/tutorial/message-a-creator", permanent: true },
    ];
  },
};

export default nextConfig;
