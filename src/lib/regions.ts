import type { Region } from '@/payload-types'

// A region is only readable once populated (depth ≥ 1); a bare id has no name to show
export const regionName = (region: number | Region | null | undefined) =>
  typeof region === 'object' ? (region?.name ?? null) : null
