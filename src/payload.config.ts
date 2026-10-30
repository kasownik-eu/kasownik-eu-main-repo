import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Cities } from './collections/Cities'
import { Operators } from './collections/Operators'
import { TariffSyncs } from './collections/TariffSyncs'
import { syncTariffsTask } from './jobs/syncTariffs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Operators, Cities, TariffSyncs],
  jobs: {
    tasks: [syncTariffsTask],
    // Picks up scheduled tariff syncs; needs a long-running server (next dev / next start)
    autoRun: [{ cron: '0 */5 * * * *', queue: 'tariffs' }],
  },
  localization: {
    locales: [
      { code: 'pl', label: 'Polski' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'pl',
    fallback: true,
  },
  editor: lexicalEditor(),
  // Without SMTP_HOST Payload falls back to logging emails to the console (fine for local dev)
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@transport-helper.local',
        defaultFromName: process.env.EMAIL_FROM_NAME || 'Transport Helper',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        },
      })
    : undefined,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
