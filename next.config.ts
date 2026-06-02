import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias["@mediapipe/selfie_segmentation"] = path.resolve(
      process.cwd(),
      "src/lib/selfie_segmentation_alias.js"
    );
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@mediapipe/selfie_segmentation": "./src/lib/selfie_segmentation_alias.js",
    },
  },
};

export default nextConfig;
