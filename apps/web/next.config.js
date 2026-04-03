/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/api", "@repo/db", "@repo/types", "@repo/ui", "@repo/utils"],
};

export default nextConfig;
