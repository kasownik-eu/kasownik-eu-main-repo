import type { CollectionConfig, Condition, Field } from 'payload'

// Option values are stable keys; frontend labels come from messages/<locale>.json (TransportModes)
export const transportModeOptions = [
  { label: 'Tram', value: 'tram' },
  { label: 'Bus', value: 'bus' },
  { label: 'Metro', value: 'metro' },
  { label: 'Train', value: 'train' },
  { label: 'Trolleybus', value: 'trolleybus' },
  { label: 'Ferry', value: 'ferry' },
]

export const ticketCategories = ['single', 'short', 'long', 'other'] as const

// Decides the icon shown next to a purchase method; labels live in the method itself
export const purchaseMethodTypes = ['machine', 'app', 'office', 'contactless', 'driver', 'sms', 'other'] as const

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

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'regionPath', type: 'text', localized: true },
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
              name: 'operator',
              type: 'group',
              fields: [
                { name: 'name', type: 'text', required: true },
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
          ],
        },
      ],
    },
  ],
}
