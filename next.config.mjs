/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdf-parse out of the bundle; it is loaded at runtime by the routes
  // that read uploaded resumes.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
