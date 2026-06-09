import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // ImgBB image hosting
        protocol: "https",
        hostname: "i.ibb.co",
        port: "",
        pathname: "/**",
      },
      {
        // ImgBB display URLs sometimes use this host
        protocol: "https",
        hostname: "ibb.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
  turbopack: {},
};

export default nextConfig;
