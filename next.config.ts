import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Official sprites are hotlinked from PokeAPI (see src/pokeapi/sprites.ts).
    remotePatterns: [new URL("https://raw.githubusercontent.com/PokeAPI/**")],
  },
};

export default nextConfig;
