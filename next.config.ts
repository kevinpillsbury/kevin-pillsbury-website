import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/rate-my-plot", destination: "/rate-your-synopsis", permanent: true },
      { source: "/rate-my-synopsis", destination: "/rate-your-synopsis", permanent: true },
    ];
  },
};

export default nextConfig;
