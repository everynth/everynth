import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM + data files it loads relative to itself; keep it out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
