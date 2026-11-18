'use client'

import { ArrowLeftIcon, SearchIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useId, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type { SearchHit } from '@/search/engine'
import { useSearch } from '@/search/useSearch'

// Rows before "Show all results (N)": the inline panel stays small, the dialog has a whole screen
const INLINE_LIMIT = 5
const DIALOG_LIMIT = 8

const hrefOf = (hit: SearchHit) =>
  hit.kind === 'city'
    ? ({ pathname: '/city/[slug]', params: { slug: hit.slug } } as const)
    : ({ pathname: '/operator/[slug]', params: { slug: hit.slug } } as const)

type Row = { type: 'hit'; hit: SearchHit } | { type: 'all'; count: number }

type Props = {
  // inline: label, field and button, results in a panel under (or over) the field; on phones a big
  //   button that opens the full-screen dialog. menu: a yellow "Search" button for the black header
  variant?: 'inline' | 'menu'
  // Where the inline panel opens; "up" near the bottom of the page
  placement?: 'down' | 'up'
  // Controlled query: list pages filter their own list with the same text
  query?: string
  onQueryChange?: (query: string) => void
  className?: string
}

// The one search of the site: every city and operator in every country, the same data and behaviour
// wherever it appears (home hero and tour, the header, the list pages)
export function SiteSearch({
  variant = 'inline',
  placement = 'down',
  query: controlledQuery,
  onQueryChange,
  className,
}: Props) {
  const t = useTranslations('SiteSearch')
  const router = useRouter()
  const id = useId()
  const [ownQuery, setOwnQuery] = useState('')
  const query = controlledQuery ?? ownQuery
  // A new query starts from the top with the short list
  const setQuery = (value: string) => {
    setOwnQuery(value)
    onQueryChange?.(value)
    setActive(-1)
    setShowAll(false)
  }

  const [panelOpen, setPanelOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [showAll, setShowAll] = useState(false)
  const inlineInput = useRef<HTMLInputElement>(null)
  const dialogInput = useRef<HTMLInputElement>(null)

  const { engine, status, load, hits, active: hasQuery } = useSearch(query)

  const limit = showAll ? Infinity : dialogOpen ? DIALOG_LIMIT : INLINE_LIMIT
  const shown: SearchHit[] = hasQuery ? (hits ?? []) : (engine?.popular ?? [])
  const rows: Row[] = shown.slice(0, limit).map((hit) => ({ type: 'hit', hit }))
  if (shown.length > limit) rows.push({ type: 'all', count: shown.length })

  const found = hits?.length ?? 0
  const head =
    status === 'error'
      ? t('error')
      : !engine
        ? t('loading')
        : hasQuery
          ? found
            ? t('found', { count: found })
            : t('noResults')
          : t('popular')
  const announce = hasQuery && engine ? head : status === 'error' ? head : ''

  const ids = {
    inline: `${id}-q`,
    dialog: `${id}-dq`,
    hint: `${id}-hint`,
    listbox: `${id}-lb`,
    option: (index: number) => `${id}-o${index}`,
  }

  const close = () => {
    setPanelOpen(false)
    setDialogOpen(false)
    setActive(-1)
  }

  const go = (hit: SearchHit) => {
    close()
    router.push(hrefOf(hit))
  }

  const choose = (row: Row) => {
    if (row.type === 'all') {
      setShowAll(true)
      return
    }
    go(row.hit)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, inDialog: boolean) => {
    const count = rows.length
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setPanelOpen(true)
      if (!count) return
      setActive((current) =>
        event.key === 'ArrowDown'
          ? (current + 1) % count
          : current <= 0
            ? count - 1
            : current - 1,
      )
    } else if (event.key === 'Enter' && active >= 0 && rows[active]) {
      event.preventDefault()
      choose(rows[active])
    } else if (event.key === 'Escape' && !inDialog) {
      // In the dialog Escape closes the dialog itself
      if (panelOpen) close()
      else if (query) setQuery('')
    }
  }

  // Enter or the button: the highlighted row, else the best match
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (active >= 0 && rows[active]) return choose(rows[active])
    if (hits?.[0]) return go(hits[0])
    setPanelOpen(true)
  }

  const clear = (input: React.RefObject<HTMLInputElement | null>) => {
    setQuery('')
    input.current?.focus()
  }

  const comboboxProps = (inDialog: boolean) =>
    ({
      role: 'combobox',
      type: 'text',
      autoComplete: 'off',
      spellCheck: false,
      value: query,
      'aria-autocomplete': 'list',
      'aria-expanded': inDialog || panelOpen,
      'aria-controls': ids.listbox,
      'aria-activedescendant': active >= 0 ? ids.option(active) : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value)
        setPanelOpen(true)
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => onKeyDown(event, inDialog),
      className:
        'h-14 rounded-[6px] border-2 bg-background pr-14 pl-4 text-lg md:text-lg dark:bg-background',
    }) as const

  const field = (inDialog: boolean) => {
    const input = inDialog ? dialogInput : inlineInput
    return (
      <div className="flex flex-wrap gap-2">
        <div className={cn('relative min-w-0', inDialog ? 'flex-[1_1_10rem]' : 'flex-[1_1_15rem]')}>
          <Input
            id={inDialog ? ids.dialog : ids.inline}
            ref={input}
            {...comboboxProps(inDialog)}
            aria-describedby={inDialog ? undefined : ids.hint}
            onFocus={() => {
              load()
              if (!inDialog) setPanelOpen(true)
            }}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute top-1/2 right-1 size-11 -translate-y-1/2 rounded-[6px]"
              aria-label={t('clear')}
              onClick={() => clear(input)}
            >
              <XIcon aria-hidden="true" className="size-[22px]" strokeWidth={2.5} />
            </Button>
          )}
        </div>
        <Button type="submit" size="lg" className="h-14 px-5 text-[1.0625rem] font-bold">
          <SearchIcon aria-hidden="true" className="size-5" strokeWidth={2.5} />
          {t('submit')}
        </Button>
      </div>
    )
  }

  const results = (inDialog: boolean) => (
    <Results
      rows={rows}
      query={query.trim()}
      showNone={hasQuery && !!engine && found === 0}
      listboxId={ids.listbox}
      optionId={ids.option}
      active={active}
      large={inDialog}
      onChoose={(row, event) => {
        if (row.type === 'all') {
          event.preventDefault()
          setShowAll(true)
          return
        }
        close()
      }}
      onAllCities={close}
    />
  )

  const dialog = (
    <Sheet open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : close())}>
      <SheetContent
        side="top"
        showCloseButton={false}
        initialFocus={dialogInput}
        overlayClassName="md:bg-foreground/55 md:supports-backdrop-filter:backdrop-blur-none"
        // data-[side=top] to outrank the sheet's own top-side classes. Phones: the whole screen;
        // tablets and up: a panel hanging from the top edge over a dimmed page
        className={cn(
          'gap-0 p-0 text-base data-[side=top]:bottom-0 data-[side=top]:h-dvh data-[side=top]:border-0',
          'md:data-[side=top]:bottom-auto md:data-[side=top]:mx-auto md:data-[side=top]:h-auto md:data-[side=top]:max-h-[85vh] md:data-[side=top]:w-full md:data-[side=top]:max-w-160 md:data-[side=top]:overflow-hidden md:data-[side=top]:rounded-b-xl md:data-[side=top]:border-2 md:data-[side=top]:border-t-0',
        )}
      >
        <form role="search" onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid gap-3 border-b-2 bg-primary px-4 pt-3 pb-4 text-primary-foreground [&_:focus-visible]:shadow-[0_0_0_6px_var(--background)]">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 gap-2 rounded-[6px] border-2 border-foreground pr-4 pl-3 text-[1.0625rem] font-bold"
                onClick={close}
              >
                <ArrowLeftIcon aria-hidden="true" className="size-[22px] md:hidden" strokeWidth={2.5} />
                <XIcon aria-hidden="true" className="hidden size-[22px] md:block" strokeWidth={2.5} />
                <span className="md:hidden">{t('back')}</span>
                <span className="hidden md:inline">{t('close')}</span>
              </Button>
              <SheetTitle className="text-lg font-bold">{t('dialogTitle')}</SheetTitle>
            </div>
            <div>
              <Label htmlFor={ids.dialog} className="mb-2 text-lg font-semibold">
                {t('label')}
              </Label>
              {field(true)}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto md:max-h-[60vh] md:flex-none">
            <ResultsHead text={head} className="sticky top-0 z-10 border-b border-line-soft" />
            {results(true)}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )

  const liveRegion = (
    <p role="status" className="sr-only">
      {announce}
    </p>
  )

  if (variant === 'menu') {
    return (
      <div className={className}>
        {liveRegion}
        <Button
          type="button"
          aria-haspopup="dialog"
          // Phones: icon only, so brand, search and text size share the first header row
          className="h-11 min-w-11 gap-2 rounded-lg border-primary px-2.5 text-sm font-bold sm:px-3.5"
          onClick={() => {
            load()
            setDialogOpen(true)
          }}
          onPointerEnter={load}
        >
          <SearchIcon aria-hidden="true" className="size-[18px]" strokeWidth={2.5} />
          <span className="sr-only sm:not-sr-only">{t('menuButton')}</span>
        </Button>
        {dialog}
      </div>
    )
  }

  return (
    <div className={cn('max-w-180', className)}>
      {liveRegion}

      {/* Phones: a big button opening the full-screen dialog */}
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          aria-haspopup="dialog"
          className="h-auto min-h-16 w-full justify-between gap-3 rounded-[6px] border-2 border-foreground bg-background pr-2.5 pl-4 text-left text-lg font-semibold whitespace-normal"
          onClick={() => {
            load()
            setDialogOpen(true)
          }}
        >
          <span className="min-w-0 truncate">{query || t('label')}</span>
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-[6px] border-2 border-foreground bg-primary text-primary-foreground"
          >
            <SearchIcon className="size-[22px]" strokeWidth={2.5} />
          </span>
        </Button>
        <p className="mt-2 text-base text-muted-foreground">{t('hintShort')}</p>
      </div>

      {/* Tablets and up: the field itself, results in a panel */}
      <form
        role="search"
        className="hidden md:block"
        onSubmit={onSubmit}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close()
        }}
      >
        <Label htmlFor={ids.inline} className="mb-2 text-lg font-semibold">
          {t('label')}
        </Label>
        <div className="relative">
          {field(false)}
          {panelOpen && !dialogOpen && (
            <div
              // Clicks inside keep the focus in the field, so the panel stays open
              onMouseDown={(event) => event.preventDefault()}
              className={cn(
                'absolute inset-x-0 z-20 overflow-hidden rounded-[10px] border-2 bg-background text-foreground shadow-[0_10px_24px_rgb(17_17_17/0.28)]',
                'animate-in duration-400 ease-in-out fade-in motion-reduce:animate-none',
                placement === 'up'
                  ? 'bottom-full mb-1.5 slide-in-from-bottom-4'
                  : 'top-full mt-1.5 slide-in-from-top-4',
              )}
            >
              <ResultsHead text={head} />
              <div className={cn(showAll && 'max-h-[min(60vh,32rem)] overflow-y-auto')}>
                {results(false)}
              </div>
            </div>
          )}
        </div>
        <p id={ids.hint} className="mt-2 text-base text-muted-foreground">
          {t('hint')}
        </p>
      </form>

      {dialog}
    </div>
  )
}

function ResultsHead({ text, className }: { text: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex min-h-11 items-center bg-muted px-4 text-sm font-semibold', className)}
    >
      {text}
    </div>
  )
}

type ResultsProps = {
  rows: Row[]
  query: string
  showNone: boolean
  listboxId: string
  optionId: (index: number) => string
  active: number
  large: boolean
  onChoose: (row: Row, event: React.MouseEvent) => void
  onAllCities: () => void
}

function Results({
  rows,
  query,
  showNone,
  listboxId,
  optionId,
  active,
  large,
  onChoose,
  onAllCities,
}: ResultsProps) {
  const t = useTranslations('SiteSearch')

  const optionClass = (index: number) =>
    cn(
      'flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 text-left text-foreground hover:bg-highlight',
      large ? 'min-h-16 py-2' : 'min-h-14 py-1.5',
      index === active && 'bg-highlight-hover outline-3 -outline-offset-3 outline-foreground hover:bg-highlight-hover',
    )

  return (
    <>
      {rows.length > 0 && (
        <ul id={listboxId} role="listbox" aria-label={t('results')}>
          {rows.map((row, index) => (
            <li key={row.type === 'hit' ? row.hit.id : 'all'} role="presentation" className="border-t border-line-soft">
              {row.type === 'hit' ? (
                <Link
                  href={hrefOf(row.hit)}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                  className={optionClass(index)}
                  onClick={(event) => onChoose(row, event)}
                >
                  <span className={cn('min-w-0 flex-[1_1_9em] font-medium', large ? 'text-lg' : 'text-[1.0625rem]')}>
                    <Marked name={row.hit.name} marks={row.hit.marks} />
                  </span>
                  <Badge
                    variant={row.hit.kind === 'city' ? 'default' : 'outline'}
                    className="h-auto rounded-[6px] border-foreground px-2.5 text-[0.8125rem] font-semibold"
                  >
                    {t(`kind.${row.hit.kind}`)}
                  </Badge>
                  {row.hit.country && (
                    <span className="text-sm text-muted-foreground">{row.hit.country}</span>
                  )}
                </Link>
              ) : (
                <button
                  type="button"
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                  className={cn(optionClass(index), 'font-bold', large ? 'text-lg' : 'text-[1.0625rem]')}
                  onClick={(event) => onChoose(row, event)}
                >
                  {t('showAll', { count: row.count })}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {showNone && (
        <div className="border-t border-line-soft p-4">
          <p className="mb-1 font-bold">{t('noResultsTitle', { query })}</p>
          <p className="mb-3">{t('noResultsText')}</p>
          <Button size="lg" className="font-bold" nativeButton={false} render={<Link href="/cities" onClick={onAllCities} />}>
            {t('allCities')}
          </Button>
        </div>
      )}
    </>
  )
}

// The typed part of a name, marked in yellow
function Marked({ name, marks }: { name: string; marks: [number, number][] }) {
  if (!marks.length) return <>{name}</>
  const parts: React.ReactNode[] = []
  let at = 0
  marks.forEach(([start, end]) => {
    if (start > at) parts.push(name.slice(at, start))
    parts.push(
      <strong key={start} className="bg-primary font-extrabold text-primary-foreground">
        {name.slice(start, end)}
      </strong>,
    )
    at = end
  })
  if (at < name.length) parts.push(name.slice(at))
  return <>{parts}</>
}
