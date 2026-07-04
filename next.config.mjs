/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the heavy headless-browser packages out of the bundle; they are loaded
  // at runtime only inside the PDF API route.
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium", "pdf-parse"],
};

export default nextConfig;
