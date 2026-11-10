import type { CollectionConfig, RelationshipFieldSingleValidation } from 'payload'

// The region must belong to the city's country (the admin filter alone can be bypassed via the API)
const validateRegion: RelationshipFieldSingleValidation = async (value, { siblingData, req }) => {
  if (!value) return true
  const country = (siblingData as { country?: number | null }).country
  if (!country) return 'Select a country first.'
  const region = await req.payload.findByID({ collection: 'regions', id: value as number, depth: 0, req })
  const regionCountry = typeof region.country === 'object' ? region.country.id : region.country
  return regionCountry === country || 'This region does not belong to the selected country.'
}

// A city is an entry point (URL, list row); content lives on the operators that list it in `cities`
export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'region', 'primaryOperator', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'country', type: 'relationship', relationTo: 'countries', admin: { width: '50%' } },
        {
          name: 'region',
          type: 'relationship',
          relationTo: 'regions',
          index: true,
          // Only regions of the selected country; pick the country first
          filterOptions: ({ siblingData }) => {
            const country = (siblingData as { country?: number | { id: number } | null })?.country
            const id = typeof country === 'object' ? country?.id : country
            return id ? { country: { equals: id } } : false
          },
          validate: validateRegion,
          admin: {
            width: '50%',
            condition: (_, siblingData) => Boolean(siblingData?.country),
          },
        },
      ],
    },
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
