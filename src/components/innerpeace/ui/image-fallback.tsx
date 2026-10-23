'use client'

import { useState } from 'react'

interface ImageFallbackProps {
  src: string
  alt: string
  className?: string
  /** gradient overlay to keep text readable on top */
  overlay?: boolean
  children?: React.ReactNode
}

const GRADIENTS = [
  'linear-gradient(135deg, oklch(0.35 0.07 160), oklch(0.25 0.05 200))',
  'linear-gradient(135deg, oklch(0.32 0.06 185), oklch(0.24 0.04 160))',
  'linear-gradient(135deg, oklch(0.4 0.08 90), oklch(0.28 0.05 165))',
]

/** Image with graceful gradient fallback if loading fails. */
export function ImageFallback({ src, alt, className = '', overlay = false, children }: ImageFallbackProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const gradient = GRADIENTS[Math.abs(hash(src)) % GRADIENTS.length]

  return (
    <div className={`relative overflow-hidden ${className}`} style={failed ? { background: gradient } : undefined}>
      {!failed && (
         
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {overlay && !failed && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      )}
      {children}
    </div>
  )
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
