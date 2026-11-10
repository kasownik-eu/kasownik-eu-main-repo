import type { CollectionConfig } from 'payload'

// Dictionary of first-level regions within a country (in Poland: voivodeships)
export const Regions: CollectionConfig = {
  slug: 'regions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'country', 'code', 'updatedAt'],
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
      admin: { description: 'ISO 3166-2, e.g. "PL-24".' },
    },
    { name: 'country', type: 'relationship', relationTo: 'countries', required: true, index: true },
  ],
}
