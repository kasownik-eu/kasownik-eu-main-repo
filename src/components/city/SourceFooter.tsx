import { getFormatter, getTranslations } from 'next-intl/server'
import React from 'react'

import { SiteFooter } from '@/components/site/SiteFooter'
import type { SourcesView } from '@/content'

type Props = {
  sources: SourcesView | null
  verifiedAt?: string | null
  reportUrl?: string
}

export async function SourceFooter({ sources, verifiedAt, reportUrl = '#' }: Props) {
  const t = await getTranslations('SourceFooter')
  const tCommon = await getTranslations('Common')
  const format = await getFormatter()
  const items = sources?.items ?? []

  return (
    <SiteFooter actionLabel={t('reportError')} actionHref={reportUrl}>
          {items.length > 0 && (
            <p>
              {t('sources')}:{' '}
              {items.map((source, index) => (
                <React.Fragment key={index}>
                  {index > 0 && ', '}
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-3 hover:text-primary"
                    >
                      {source.label}
                      <span className="sr-only"> {tCommon('opensInNewTab')}</span>
                    </a>
                  ) : (
                    source.label
                  )}
                </React.Fragment>
              ))}
            </p>
          )}
          {(sources?.aiAssisted || verifiedAt) && (
            <p className="mt-1">
              {sources?.aiAssisted && t('aiAssisted')}
              {sources?.aiAssisted && verifiedAt && ' · '}
              {verifiedAt &&
                t('verified', {
                  date: format.dateTime(new Date(verifiedAt), { dateStyle: 'medium' }),
                })}
            </p>
          )}
    </SiteFooter>
  )
}
