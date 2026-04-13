import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  logging: {
    browserToTerminal: true,
  },
};

export default nextConfig;
