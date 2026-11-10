import type { CollectionConfig } from 'payload'

// Dictionary of countries; regions and cities point here
export const Countries: CollectionConfig = {
  slug: 'countries',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'ISO 3166-1 alpha-2, e.g. "PL".' },
    },
    {
      name: 'regions',
      type: 'join',
      collection: 'regions',
      on: 'country',
      // Sorting a join by a localized field breaks the SQLite adapter's query
      defaultSort: 'code',
    },
  ],
}
