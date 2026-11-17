export type { TransportMode } from '@/content/enums'

// Logo fallback when no short name is set: first letters of the operator name
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
