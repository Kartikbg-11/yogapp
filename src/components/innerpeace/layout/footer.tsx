'use client'

import { Flower2 } from 'lucide-react'

/** Sticky footer — sits at the bottom of the viewport on short pages,
    pushes down naturally when content overflows. */
export function Footer() {
  return (
    <footer className="mt-auto border-t bg-sidebar/60 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Flower2 className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-elegant text-sm text-foreground">InnerPeace</span>
          <span aria-hidden="true">|</span>
          <span>Yoga • Meditation • Mantra — A Better You</span>
        </div>
        <p>Breathe deeply. Move gently. Live mindfully.</p>
      </div>
    </footer>
  )
}
