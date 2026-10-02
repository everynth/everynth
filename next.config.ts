import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM + data files it loads relative to itself; keep it out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],

  // "Launch" meant two different things once the launchpad was announced. The permalinks now say
  // which: /launch/product lists something for sale, /launch/token is the (unbuilt) token side.
  // The bare /launch is kept forever so older links, posts and screenshots still land correctly.
  async redirects() {
    return [
      { source: "/launch", destination: "/launch/product", permanent: true },
      { source: "/launch/token", destination: "/launchpad", permanent: true },
    ];
  },
};

export default nextConfig;
