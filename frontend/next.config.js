const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  poweredByHeader: false,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/runs/:slug',
        destination: `${process.env.BACKEND_API_HOST}/runs/:slug`,
      },
      {
        source: '/api/runs',
        destination: `${process.env.BACKEND_API_HOST}/runs`,
      },
      {
        source: '/api/health',
        destination: `${process.env.BACKEND_API_HOST}/health`,
      },
      {
        source: '/api/cancel_evaluation',
        destination: `${process.env.BACKEND_API_HOST}/cancel_evaluation`,
      },
    ]
  },
}

module.exports = nextConfig
