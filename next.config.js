/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    useTypeScriptCli: true,
  },
}

module.exports = nextConfig
