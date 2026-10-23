'use client'

import { useState } from 'react'
import { Flower2, Bell } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Moon, Sun, LogOut } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { quoteOfDay } from '@/lib/quotes'

export function TopBar() {
  const { user, signOut, view } = useAppStore()
  const { resolvedTheme, setTheme } = useTheme()
  const [quote] = useState(() => quoteOfDay())
  const isDark = (resolvedTheme ?? 'dark') === 'dark'

  const titles: Record<string, string> = {
    dashboard: 'Home',
    yoga: 'Yoga Practice',
    meditation: 'Guided Meditation',
    mantra: 'Mantra Chanting',
    progress: 'Progress & Stats',
    journal: 'Journal',
    settings: 'Settings',
  }

  return (
    <header className="sticky top-0 z-30 glass-strong border-b px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="lg:hidden h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Flower2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="font-elegant text-base sm:text-lg font-semibold truncate">
            {titles[view] ?? 'InnerPeace'}
          </h2>
          <p className="hidden sm:block text-xs text-muted-foreground truncate">
            &ldquo;{quote.text}&rdquo; — {quote.author}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications (daily reminder)" onClick={() => {}}>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Toggle theme"
          onClick={() => isDark ? setTheme('light') : setTheme('dark')}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" aria-label="Sign out" onClick={signOut}>
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </header>
  )
}
