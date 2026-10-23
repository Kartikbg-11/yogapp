'use client'

import { useEffect, useRef, useState } from 'react'

interface ProgressRingProps {
  /** 0..1 — values above 1 are capped for the ring arc */
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
  className?: string
  /** animate from 0 on mount */
  animate?: boolean
}

/** Elegant animated circular progress ring with a soft glow cap. */
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'var(--primary)',
  trackColor = 'color-mix(in oklab, var(--primary) 15%, transparent)',
  children,
  className = '',
  animate = true,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress))
  const [animProgress, setAnimProgress] = useState<number | null>(animate ? 0 : null)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) return
    const start = performance.now()
    const duration = 900
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimProgress(clamped * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [clamped, animate])

  const display = animate ? (animProgress ?? 0) : clamped

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - display)

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={`Progress ${Math.round(clamped * 100)}%`}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.15s linear',
            filter: 'drop-shadow(0 0 6px color-mix(in oklab, currentColor 40%, transparent))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
