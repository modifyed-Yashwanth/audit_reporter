import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize packages for server-side use (Node.js runtime)
  serverExternalPackages: ["lighthouse", "chrome-launcher", "puppeteer"],
};

export default nextConfig;
