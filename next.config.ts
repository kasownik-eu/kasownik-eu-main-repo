import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// `next dev` answers 403 to JS/HMR requests from any host but localhost, so a phone opening
// http://192.168.x.x:3000 gets server HTML with no JS: nothing hydrates and no button reacts.
// Allow private LAN addresses and mDNS names; extra hosts (tunnels etc.) via ALLOWED_DEV_ORIGINS.
// Dev-only: `next start` ignores this option.
const allowedDevOrigins = [
  '10.*.*.*',
  '192.168.*.*',
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
  '*.local',
  ...(process.env.ALLOWED_DEV_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
]

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins,
  images: {
    unoptimized: true, // no sharp on the host
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
