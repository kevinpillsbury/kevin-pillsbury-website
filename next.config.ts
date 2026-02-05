import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [{ source: "/rate-my-plot", destination: "/rate-my-synopsis", permanent: true }];
  },
};

export default nextConfig;
