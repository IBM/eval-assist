/** @type {import('next').NextConfig} */

const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const output_mode = process.env.NEXT_OUTPUT_MODE || 'standalone'

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },

  poweredByHeader: false,
  output: output_mode,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BACKEND_API_HOST: process.env.NEXT_PUBLIC_BACKEND_API_HOST,
  },
}

module.exports = nextConfig
