import { getFormatter, getTranslations } from 'next-intl/server'
import React from 'react'

import { Button } from '@/components/ui/button'
import type { Operator } from '@/payload-types'

type Props = {
  sources: Operator['sources']
  verifiedAt?: string | null
  reportUrl?: string
}

export async function SourceFooter({ sources, verifiedAt, reportUrl = '#' }: Props) {
  const t = await getTranslations('SourceFooter')
  const tCommon = await getTranslations('Common')
  const format = await getFormatter()
  const items = sources?.items ?? []

  return (
    <footer className="chrome mt-16 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 sm:px-6">
        <div className="max-w-[70ch] flex-[1_1_20rem] text-sm text-muted-foreground">
          {items.length > 0 && (
            <p>
              {t('sources')}:{' '}
              {items.map((source, index) => (
                <React.Fragment key={source.id ?? index}>
                  {index > 0 && ', '}
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-3 hover:text-foreground">
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
              {verifiedAt && t('verified', { date: format.dateTime(new Date(verifiedAt), { dateStyle: 'medium' }) })}
            </p>
          )}
        </div>
        <Button size="lg" nativeButton={false} render={<a href={reportUrl} />}>
          {t('reportError')}
        </Button>
      </div>
    </footer>
  )
}
