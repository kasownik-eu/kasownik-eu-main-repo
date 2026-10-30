import type { CollectionConfig, Condition, Field } from 'payload'

// Option values are stable keys; frontend labels come from messages/<locale>.json (TransportModes)
export const transportModes = ['tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry'] as const

export const transportModeOptions = transportModes.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}))

export const ticketCategories = ['single', 'short', 'long', 'other'] as const

// Decides the icon shown next to a purchase method; labels live in the method itself
export const purchaseMethodTypes = ['machine', 'app', 'office', 'contactless', 'driver', 'sms', 'other'] as const

// Option values are stable keys; frontend labels come from messages/<locale>.json (RelatedOperators)
export const operatorRelations = ['neighbourCity', 'sharedArea', 'regional', 'private'] as const

export const ticketValidities = ['valid', 'partial', 'invalid'] as const

const transportModesField = (name = 'transportModes'): Field => ({
  name,
  type: 'select',
  hasMany: true,
  options: transportModeOptions,
})

const stepsField = (name: string, condition?: Condition): Field => ({
  name,
  type: 'array',
  maxRows: 6,
  admin: { condition },
  fields: [{ name: 'text', type: 'textarea', required: true, localized: true }],
})

// Holds all ticket content and the cities it serves (many-to-many: a city may have several operators)
export const Operators: CollectionConfig = {
  slug: 'operators',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  // Every save (manual or tariff sync) is a version; revert via the Versions tab
  versions: { maxPerDoc: 50 },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar' } },
    {
      name: 'sampleData',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Shows a notice that names, prices and rules are made up.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Operator',
          fields: [
            {
              name: 'shortName',
              type: 'text',
              admin: { description: 'Abbreviation, e.g. "ZTM". Used as logo fallback and in contact labels.' },
            },
            { name: 'label', type: 'text', localized: true },
            { name: 'logo', type: 'upload', relationTo: 'media' },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              admin: { description: 'Max. 3 sentences.' },
            },
            { name: 'websiteUrl', type: 'text' },
            { name: 'timetableUrl', type: 'text' },
            transportModesField(),
            { name: 'zoneCount', type: 'number', min: 0 },
            { name: 'currency', type: 'text', defaultValue: 'PLN' },
            {
              name: 'paymentInfo',
              type: 'text',
              localized: true,
              admin: { description: 'Short summary, e.g. "PLN, card, app".' },
            },
            { name: 'hotline', type: 'text', admin: { description: "Operator's phone number." } },
            {
              name: 'servicePoint',
              type: 'text',
              localized: true,
              admin: { description: "Operator's customer service point: address and opening hours." },
            },
            { name: 'verifiedAt', type: 'date' },
          ],
        },
        {
          label: 'Cities',
          fields: [
            {
              name: 'cities',
              type: 'relationship',
              relationTo: 'cities',
              hasMany: true,
              index: true,
              admin: { description: 'Cities served by this operator. A city can be served by several operators.' },
            },
          ],
        },
        {
          label: 'Purchase methods',
          fields: [
            {
              name: 'purchaseMethods',
              type: 'array',
              maxRows: 6,
              admin: { initCollapsed: true, description: 'Shown in this order; the first one is expanded.' },
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  defaultValue: 'machine',
                  options: purchaseMethodTypes.map((value) => ({ label: value, value })),
                },
                { name: 'title', type: 'text', required: true, localized: true },
                { name: 'subtitle', type: 'text', localized: true },
                { name: 'requiresValidation', type: 'checkbox', defaultValue: true },
                stepsField('buySteps'),
                stepsField('validationSteps', (_, siblingData) => Boolean(siblingData?.requiresValidation)),
                {
                  name: 'noValidationText',
                  type: 'textarea',
                  localized: true,
                  admin: { condition: (_, siblingData) => !siblingData?.requiresValidation },
                },
                {
                  name: 'validationPhotos',
                  type: 'array',
                  maxRows: 6,
                  admin: {
                    initCollapsed: true,
                    description: 'Photos of the validator or ticket screen, shown under "How to validate". Optional.',
                  },
                  fields: [
                    { name: 'image', type: 'upload', relationTo: 'media', required: true },
                    { name: 'caption', type: 'text', required: true, localized: true },
                    {
                      name: 'alt',
                      type: 'text',
                      localized: true,
                      admin: { description: "Describes the photo for screen readers. Falls back to the image's alt." },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Tickets',
          fields: [
            {
              name: 'tickets',
              type: 'array',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'category',
                  type: 'select',
                  required: true,
                  options: ticketCategories.map((value) => ({ label: value, value })),
                },
                { name: 'name', type: 'text', required: true, localized: true },
                { name: 'validity', type: 'text', localized: true },
                { name: 'scope', type: 'text', localized: true },
                transportModesField(),
                { name: 'priceNormal', type: 'number', min: 0 },
                { name: 'priceReduced', type: 'number', min: 0 },
                { name: 'whereToBuy', type: 'text', localized: true },
              ],
            },
            {
              name: 'luggage',
              type: 'array',
              admin: { initCollapsed: true },
              fields: [
                { name: 'item', type: 'text', required: true, localized: true },
                {
                  name: 'note',
                  type: 'text',
                  localized: true,
                  admin: { description: 'Short qualifier, e.g. size limit.' },
                },
                transportModesField(),
                {
                  name: 'fee',
                  type: 'number',
                  min: 0,
                  admin: { description: 'Leave empty when free of charge.' },
                },
                {
                  name: 'feeText',
                  type: 'text',
                  localized: true,
                  admin: { description: 'Replaces the fee display, e.g. "free off-peak".' },
                },
                { name: 'conditions', type: 'text', localized: true },
                { name: 'whereToBuy', type: 'text', localized: true },
              ],
            },
            { name: 'rulesNote', type: 'textarea', localized: true },
            { name: 'rulesUrl', type: 'text' },
          ],
        },
        {
          label: 'Zones',
          fields: [
            {
              name: 'zones',
              type: 'group',
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: false },
                {
                  name: 'map',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
                },
                {
                  name: 'items',
                  type: 'array',
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
                  fields: [
                    { name: 'name', type: 'text', required: true, localized: true },
                    { name: 'covers', type: 'text', localized: true },
                  ],
                },
                {
                  name: 'noteTitle',
                  type: 'text',
                  localized: true,
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
                },
                {
                  name: 'note',
                  type: 'textarea',
                  localized: true,
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
                },
              ],
            },
          ],
        },
        {
          label: 'Related',
          fields: [
            {
              name: 'relatedOperators',
              type: 'array',
              admin: {
                initCollapsed: true,
                description: 'Other carriers running in this area, shown on every city page of this operator.',
              },
              fields: [
                {
                  name: 'operator',
                  type: 'relationship',
                  relationTo: 'operators',
                  required: true,
                  filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
                },
                {
                  name: 'relation',
                  type: 'select',
                  required: true,
                  defaultValue: 'sharedArea',
                  options: operatorRelations.map((value) => ({ label: value, value })),
                },
                {
                  name: 'ticketValidity',
                  type: 'select',
                  required: true,
                  defaultValue: 'invalid',
                  options: ticketValidities.map((value) => ({ label: value, value })),
                  admin: { description: "Whether this operator's ticket is accepted by the related carrier." },
                },
                { name: 'note', type: 'text', localized: true },
                {
                  name: 'coverage',
                  type: 'text',
                  localized: true,
                  admin: { description: 'Where it runs, e.g. "whole region". Defaults to the cities it serves.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Sources',
          fields: [
            {
              name: 'sources',
              type: 'group',
              fields: [
                {
                  name: 'items',
                  type: 'array',
                  fields: [
                    { name: 'label', type: 'text', required: true, localized: true },
                    { name: 'url', type: 'text' },
                  ],
                },
                { name: 'aiAssisted', type: 'checkbox', defaultValue: true },
              ],
            },
            {
              name: 'tariffSources',
              type: 'group',
              admin: { description: 'Pages read by the tariff sync (tickets, luggage, zones, rules note).' },
              fields: [
                {
                  name: 'pages',
                  type: 'array',
                  fields: [
                    { name: 'url', type: 'text', required: true },
                    {
                      name: 'xpath',
                      type: 'text',
                      admin: { description: 'Selects the tariff block. If it matches nothing, the sync fails.' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
