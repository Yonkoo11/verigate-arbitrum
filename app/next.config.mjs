/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/verigate-arbitrum" : "",
  images: { unoptimized: true },
};

export default nextConfig;
