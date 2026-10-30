import type { CollectionConfig } from 'payload'

// A city is an entry point (URL, list row); content lives on the operators that list it in `cities`
export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'primaryOperator', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'regionPath', type: 'text', localized: true },
    {
      name: 'operators',
      type: 'join',
      collection: 'operators',
      on: 'cities',
      defaultSort: 'name',
      admin: { description: 'Operators serving this city. Link a city from the operator (Cities tab).' },
    },
    {
      name: 'primaryOperator',
      type: 'relationship',
      relationTo: 'operators',
      // Only operators that already serve this city
      filterOptions: ({ id }) => (id ? { cities: { equals: id } } : false),
      admin: {
        position: 'sidebar',
        description: 'Its content fills the city page; other operators are shown as related. Defaults to the first one.',
      },
    },
  ],
}
