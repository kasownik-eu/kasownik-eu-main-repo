'use client'

import React, { useEffect, useRef } from 'react'

// Tram track along the top of the black footer; the tram rolls in once the track is fully in view.
// Without JS or with reduced motion it simply stands still.
export function TramStrip() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = ref.current
    if (!track || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Phase lives in a data attribute so the server render (tram parked) needs no state
    track.dataset.phase = 'start'
    let frame = 0
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        // Two frames so the start position is painted before the transition begins
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            track.dataset.phase = 'go'
          })
        })
      },
      { threshold: 1 },
    )
    observer.observe(track)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className="group/track relative mb-6 h-3.5 overflow-hidden print:hidden">
      {/* sleepers */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,var(--rail)_0_4px,transparent_4px_16px)]" />
      {/* rails */}
      <div className="absolute inset-x-0 top-[3px] h-0.5 bg-primary" />
      <div className="absolute inset-x-0 top-[9px] h-0.5 bg-primary" />
      <svg
        viewBox="0 0 112 14"
        width="112"
        height="14"
        className="absolute top-0 left-[58%] group-data-[phase=go]/track:transition-[left] group-data-[phase=go]/track:duration-[4s] group-data-[phase=go]/track:ease-[cubic-bezier(0.2,0.7,0.3,1)] group-data-[phase=start]/track:-left-[120px]"
      >
        <g className="fill-rail">
          <rect x="32" y="3" width="7" height="8" />
          <rect x="69" y="3" width="7" height="8" />
        </g>
        <g className="fill-highlight">
          <rect x="0" y="1" width="34" height="12" rx="3" />
          <rect x="37" y="1" width="34" height="12" rx="3" />
          <path d="M77 1h25a8 6 0 0 1 8 6 8 6 0 0 1-8 6H77a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z" />
        </g>
        <g className="fill-primary">
          <rect x="7" y="4" width="20" height="6" rx="1.5" />
          <rect x="44" y="4" width="20" height="6" rx="1.5" />
          <rect x="80" y="4" width="16" height="6" rx="1.5" />
        </g>
        <path d="M50 3.5v7M58 3.5v7M50 7h8" fill="none" strokeWidth="1.5" strokeLinecap="round" className="stroke-chrome" />
        <path d="M101 3.5a5 4 0 0 1 0 7z" className="fill-chrome" />
      </svg>
    </div>
  )
}
