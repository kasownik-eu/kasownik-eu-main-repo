import type { Payload } from 'payload'

import type { Operator, TariffSync } from '@/payload-types'

const recipients = () =>
  (process.env.TARIFF_NOTIFY_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)

const runUrl = (run: TariffSync) =>
  `${process.env.SERVER_URL || 'http://localhost:3000'}/admin/collections/tariff-syncs/${run.id}`

// Notifications must never break the sync itself: failures are only logged
const send = async (payload: Payload, subject: string, lines: string[]) => {
  const to = recipients()
  if (!to.length) {
    payload.logger.warn(`TARIFF_NOTIFY_EMAILS is empty, skipping notification: ${subject}`)
    return
  }
  try {
    await payload.sendEmail({ to, subject, text: lines.join('\n') })
  } catch (err) {
    payload.logger.error({ err }, `Sending tariff notification failed: ${subject}`)
  }
}

export const notifyFailure = (payload: Payload, operator: Operator, run: TariffSync) =>
  send(payload, `[Tariff sync] ${operator.slug}: failed at ${run.failedStage ?? 'unknown'} stage`, [
    `The tariff sync for "${operator.name}" (${operator.slug}) failed. The operator data was not changed.`,
    '',
    `Stage: ${run.failedStage ?? 'unknown'}`,
    `Error: ${run.error ?? 'unknown'}`,
    '',
    `Pages:`,
    ...(operator.tariffSources?.pages ?? []).map((p) => `- ${p.url}${p.xpath ? ` (XPath: ${p.xpath})` : ''}`),
    '',
    `Run: ${runUrl(run)}`,
  ])

export const notifyReview = (payload: Payload, operator: Operator, run: TariffSync) =>
  send(payload, `[Tariff sync] ${operator.slug}: changes need review`, [
    `New tariff data for "${operator.name}" (${operator.slug}) needs manual review before it is applied.`,
    '',
    'Reasons:',
    ...(run.reviewReasons ?? []).map((r) => `- ${r.text}`),
    '',
    `${Array.isArray(run.changes) ? run.changes.length : 0} changes in total.`,
    `Review and approve or reject: ${runUrl(run)}`,
  ])
