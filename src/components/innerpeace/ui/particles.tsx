'use client'

import { useMemo } from 'react'

/** Ambient floating golden particles background. */
export function Particles({ count = 18, className = '' }: { count?: number; className?: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const size = 3 + ((i * 7) % 9)
        return {
          id: i,
          left: `${(i * 97 + 13) % 100}%`,
          size,
          duration: 18 + ((i * 13) % 22),
          delay: -((i * 7.3) % 30),
          drift: `${((i % 5) - 2) * 18}px`,
          opacity: 0.25 + ((i * 11) % 30) / 100,
        }
      }),
    [count]
  )

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--particle-drift': p.drift,
              '--particle-opacity': p.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
