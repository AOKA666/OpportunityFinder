import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/admin/**/*": [
      "./scripts/**/*.ts",
      "./lib/**/*.ts",
      "./package.json",
      "./node_modules/tsx/**/*",
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
