/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // All EPA/SEC calls happen in server route handlers; nothing is exposed client-side.
};
export default nextConfig;
