import { getPayload } from 'payload'

import config from '@payload-config'

import { seedRegions } from './data/regions'

const payload = await getPayload({ config })
const regions = await seedRegions(payload)
payload.logger.info(`Seeded ${regions.size} regions`)
process.exit(0)
