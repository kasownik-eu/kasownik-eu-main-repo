import { APIError, type CollectionConfig } from 'payload'

import { applyTariff } from '@/tariffs/applyTariff'
import { tariffSchema } from '@/tariffs/schema'

export const tariffSyncStatuses = [
  'failed',
  'unchanged_source',
  'no_changes',
  'applied',
  'pending_review',
  'approved',
  'rejected',
  'superseded',
] as const

// Only transitions a reviewer may make; everything else is set by the sync (context.tariffSync)
const reviewTransitions: Record<string, string[]> = { pending_review: ['approved', 'rejected'] }

const readOnly = { readOnly: true }

// One document per operator per sync run; doubles as the manual review queue
export const TariffSyncs: CollectionConfig = {
  slug: 'tariff-syncs',
  admin: {
    group: 'Sync',
    useAsTitle: 'title',
    defaultColumns: ['title', 'operator', 'status', 'createdAt'],
    description: 'Review queue: open a "pending_review" run, check changes and reasons, then set status to approved or rejected.',
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation, context }) => {
        if (context.tariffSync) return data
        if (operation === 'create') throw new APIError('Tariff sync runs are created by the sync job.', 403)
        if (data.status !== originalDoc?.status && !reviewTransitions[originalDoc?.status]?.includes(data.status)) {
          throw new APIError(`Status can only change from pending_review to approved or rejected.`, 400)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context.tariffSync || operation !== 'update') return doc
        if (previousDoc?.status !== 'pending_review' || doc.status !== 'approved') return doc

        const operatorId = typeof doc.operator === 'object' ? doc.operator.id : doc.operator
        const appliedVersion = await applyTariff(req.payload, operatorId, tariffSchema.parse(doc.proposed), {
          req,
          rulesUrl: doc.pages?.[0]?.url,
        })
        await req.payload.update({
          collection: 'tariff-syncs',
          id: doc.id,
          data: { appliedVersion },
          req,
          context: { tariffSync: true },
        })
        return { ...doc, appliedVersion }
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', admin: readOnly },
    { name: 'operator', type: 'relationship', relationTo: 'operators', required: true, index: true, admin: readOnly },
    {
      name: 'status',
      type: 'select',
      required: true,
      index: true,
      options: tariffSyncStatuses.map((value) => ({ label: value, value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'appliedVersion',
      type: 'text',
      admin: { ...readOnly, position: 'sidebar', description: 'Operator version created by this run (Versions tab).' },
    },
    {
      name: 'reviewReasons',
      type: 'array',
      admin: readOnly,
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'changes',
      type: 'json',
      admin: { ...readOnly, description: 'Diff against the operator at sync time: { path, kind, before, after, major }.' },
    },
    {
      name: 'failedStage',
      type: 'select',
      options: ['fetch', 'extract', 'llm', 'validate', 'compare', 'apply'].map((value) => ({ label: value, value })),
      admin: { ...readOnly, position: 'sidebar', condition: (data) => data?.status === 'failed' },
    },
    { name: 'error', type: 'textarea', admin: readOnly },
    {
      name: 'pages',
      type: 'array',
      admin: readOnly,
      fields: [
        { name: 'url', type: 'text', required: true },
        { name: 'textHash', type: 'text' },
        { name: 'changed', type: 'checkbox' },
      ],
    },
    { name: 'proposed', type: 'json', admin: { ...readOnly, description: 'Validated LLM output (pl + en).' } },
  ],
}
