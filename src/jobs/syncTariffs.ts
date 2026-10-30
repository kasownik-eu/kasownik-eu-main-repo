import type { TaskConfig } from 'payload'

export const syncTariffsTask: TaskConfig<'syncTariffs'> = {
  slug: 'syncTariffs',
  retries: 1,
  schedule: [{ cron: '0 0 3 * * *', queue: 'tariffs' }], // daily at 03:00
  inputSchema: [{ name: 'slug', type: 'text' }],
  outputSchema: [{ name: 'counts', type: 'json' }],
  handler: async ({ input, req }) => {
    // Loaded lazily: the config imports this task, and jsdom (ESM-only deps) breaks Next's server bundle
    const { syncAllTariffs } = await import('@/tariffs/syncTariffs')
    const { counts, failed } = await syncAllTariffs(req.payload, { slug: input?.slug })
    req.payload.logger.info({ counts }, 'Tariff sync finished')
    // Failing the job makes broken pages (e.g. an outdated XPath) visible in the jobs log
    if (failed.length) {
      throw new Error(`Tariff sync failed for: ${failed.map((f) => `${f.slug} (${f.error})`).join('; ')}`)
    }
    return { output: { counts } }
  },
}
