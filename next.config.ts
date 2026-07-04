import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Clear-Site-Data",
            value: "\"clientHints\"",
          },
          {
            key: "Accept-CH",
            value: "",
          },
          {
            key: "Critical-CH",
            value: "",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
