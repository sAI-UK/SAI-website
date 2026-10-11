import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sharp", "ffmpeg-static"],
  outputFileTracingIncludes: { "/api/films/**/*": ["./node_modules/ffmpeg-static/ffmpeg*"] },
};

export default nextConfig;
