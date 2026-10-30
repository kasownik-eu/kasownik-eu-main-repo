import type { Media, Operator } from '@/payload-types'

export type TransportMode = NonNullable<Operator['transportModes']>[number]

export const mediaUrl = (media: number | Media | null | undefined): Media | null =>
  media && typeof media === 'object' && media.url ? media : null

// Logo fallback when no short name is set: first letters of the operator name
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
