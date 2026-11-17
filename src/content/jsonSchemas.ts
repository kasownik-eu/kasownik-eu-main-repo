import { z } from 'zod'

import {
  citiesFile,
  countryFile,
  operatorFile,
  purchaseFile,
  ticketsFile,
  voivodeshipFile,
  zonesFile,
} from './schema'

// JSON Schemas for editors, keyed by the file they describe (country.json -> schemas/country.schema.json)
export const jsonSchemas = () =>
  Object.fromEntries(
    Object.entries({
      country: countryFile,
      voivodeship: voivodeshipFile,
      operator: operatorFile,
      cities: citiesFile,
      purchase: purchaseFile,
      tickets: ticketsFile,
      zones: zonesFile,
    }).map(([name, schema]) => [name, z.toJSONSchema(schema, { io: 'input' })]),
  )
