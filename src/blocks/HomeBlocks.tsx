import { CheckIcon, FileTextIcon, FlagIcon, UserCheckIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Section } from '@/components/city/Section'
import { SiteSearch } from '@/components/search/SiteSearch'
import { TourPreview, type TourPreviewKind } from '@/components/home/TourPreview'
import { ValidatorArt } from '@/components/home/ValidatorArt'
import { SiteFooter } from '@/components/site/SiteFooter'
import { REPORT_URL } from '@/lib/links'

import type { BlockProps } from './types'


// Yellow band: what the site answers, the search, and a ticket being stamped (desktop only)
export async function HomeHeroBlock({ id }: BlockProps<'homeHero'>) {
  const t = await getTranslations('HomeHero')
  const points = [t('point1'), t('point2'), t('point3')]

  return (
    <section
      aria-labelledby={`${id}-title`}
      // The yellow focus halo would vanish on yellow: use the page background instead
      className="border-b-2 bg-primary text-primary-foreground [&_:focus-visible]:shadow-[0_0_0_6px_var(--background)]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end gap-x-14 gap-y-8 px-4 pt-8 sm:px-6 md:pt-14">
        {/* Phones: the search right under the title, the three points after it */}
        <div className="flex min-w-0 flex-[999_1_27.5rem] flex-col pb-10 md:pb-14">
          <h1
            id={`${id}-title`}
            className="mb-4 text-[2rem] leading-[1.1] font-extrabold tracking-tight md:mb-0 md:text-[2.75rem]"
          >
            {t('title')}
          </h1>
          <ul className="order-3 mt-7 grid gap-2.5 text-lg leading-snug font-semibold md:order-2 md:mt-5 md:mb-8 md:text-xl">
            {points.map((point) => (
              <li key={point} className="grid grid-cols-[1.75rem_1fr] items-center gap-3">
                <CheckIcon aria-hidden="true" className="size-7" strokeWidth={2.5} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <SiteSearch className="order-2 md:order-3" />
        </div>
        <ValidatorArt className="hidden min-w-0 flex-[1_1_16rem] md:block" />
      </div>
    </section>
  )
}

const tourSteps: { key: 'buy' | 'prices' | 'zones'; preview: TourPreviewKind }[] = [
  { key: 'buy', preview: 'buy' },
  { key: 'prices', preview: 'prices' },
  { key: 'zones', preview: 'zones' },
]

const stopMarker =
  'relative z-10 grid size-11 place-items-center rounded-full border-4 border-foreground font-bold'

// "What an operator page holds" as a route: three stops with a drawn preview each, then the search again
export async function OperatorTourBlock({ id }: BlockProps<'operatorTour'>) {
  const t = await getTranslations('OperatorTour')

  return (
    <div className="pt-4">
      <Section id={id} title={t('title')} lead={t('lead')}>
        <ol className="mt-8">
          {tourSteps.map((step, index) => (
            <li key={step.key} className="grid grid-cols-[2.75rem_1fr] gap-x-3.5 md:gap-x-5">
              {/* the route: a line through every stop */}
              <div aria-hidden="true" className="relative">
                <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-foreground" />
                <span className={`${stopMarker} bg-primary`}>{index + 1}</span>
              </div>
              <div className="flex flex-wrap items-start gap-x-10 gap-y-6 pb-14">
                <div className="min-w-0 flex-[1_1_18.75rem]">
                  <h3 className="mt-1.5 mb-2 text-[1.375rem] leading-snug font-semibold">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <p className="text-lg">{t(`steps.${step.key}.text`)}</p>
                </div>
                <div className="min-w-0 flex-[1_1_23.75rem]">
                  <TourPreview kind={step.preview} />
                </div>
              </div>
            </li>
          ))}
          <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3.5 md:gap-x-5 lg:grid-cols-[2.75rem_minmax(0,4fr)_minmax(0,5fr)]">
            <span aria-hidden="true" className={`${stopMarker} border-0 bg-foreground text-primary`}>
              <CheckIcon className="size-[22px]" strokeWidth={3} />
            </span>
            <div>
              <h3 className="mt-1.5 mb-2 text-[1.375rem] leading-snug font-semibold">
                {t('finish.title')}
              </h3>
              <p className="text-lg">{t('finish.text')}</p>
            </div>
            <div className="col-span-2 mt-5 rounded-[14px] border-2 bg-highlight p-4 md:p-5 lg:col-span-1 lg:mt-0 lg:ml-5">
              <SiteSearch placement="up" />
            </div>
          </li>
        </ol>
      </Section>
    </div>
  )
}

// Where the information comes from: AI drafts it from official sources, a person checks it, readers report errors
export async function AiSourcesBlock({ id }: BlockProps<'aiSources'>) {
  const t = await getTranslations('AiSources')
  const items = [
    { key: 'read', Icon: FileTextIcon },
    { key: 'check', Icon: UserCheckIcon },
    { key: 'report', Icon: FlagIcon },
  ] as const

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="mt-16 rounded-[14px] border-2 bg-highlight px-5 pt-6 pb-7 sm:px-7 sm:pt-7 sm:pb-8"
    >
      <h2 id={`${id}-title`} className="text-2xl leading-tight font-semibold tracking-tight">
        {t('title')}
      </h2>
      <p className="mt-2 mb-6 max-w-[68ch] text-lg">{t('lead')}</p>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-x-7 gap-y-5">
        {items.map(({ key, Icon }) => (
          <li key={key} className="grid grid-cols-[2.75rem_1fr] items-start gap-3.5">
            <span aria-hidden="true" className="grid size-11 place-items-center rounded-[10px] bg-primary text-primary-foreground">
              <Icon className="size-[22px]" />
            </span>
            <div>
              <div className="font-semibold">{t(`${key}.title`)}</div>
              <div className="text-[0.9375rem]">{t(`${key}.text`)}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// The site footer with the note set per template
export async function SiteFooterBlock({ block }: BlockProps<'siteFooter'>) {
  const t = await getTranslations('SiteFooter')

  return (
    <SiteFooter actionLabel={t('reportError')} actionHref={REPORT_URL}>
      <p>{block.note}</p>
    </SiteFooter>
  )
}
