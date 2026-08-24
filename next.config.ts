import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    rules: {
      // 3D model assets used by the jewellery preview.
      "*.{glb,gltf}": {
        loaders: ["file-loader"],
        as: "*.js",
      },
    },
    resolveAlias: {
      // Konva's Node entry pulls in the optional `canvas` package for headless
      // rendering. The designer only ever runs Konva in the browser, so point
      // the browser resolution at an empty module instead of shipping it.
      canvas: { browser: "./src/lib/empty-module.ts" },
    },
  },
  // The Square SDK uses BigInt amounts and Node fetch internals that
  // break if the bundler rewrites the package.
  serverExternalPackages: ["square"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@react-three/drei"],
  },
};

export default nextConfig;
