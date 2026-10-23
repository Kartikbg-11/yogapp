'use client'

import { Flower2, Brain, Home, BarChart3, BookHeart, Settings, Sparkles, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import type { ViewKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const NAV: Array<{ key: ViewKey; label: string; icon: typeof Home }> = [
  { key: 'dashboard', label: 'Home', icon: Home },
  { key: 'yoga', label: 'Yoga', icon: Flower2 },
  { key: 'meditation', label: 'Meditation', icon: Brain },
  { key: 'mantra', label: 'Mantra Chanting', icon: Sparkles },
  { key: 'progress', label: 'Progress', icon: BarChart3 },
  { key: 'journal', label: 'Journal', icon: BookHeart },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { view, setView, user, signOut } = useAppStore()
  const { theme, setTheme } = useTheme()

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground sticky top-0 h-screen px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
          <Flower2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-elegant text-xl font-semibold text-primary leading-tight">InnerPeace</h1>
          <p className="text-[11px] text-muted-foreground tracking-wide">Breathe • Meditate • Grow</p>
        </div>
      </div>

      <nav className="mt-8 flex-1 flex flex-col gap-1" aria-label="Main navigation">
        {NAV.map((item) => {
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2 px-1">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-3 text-muted-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
              {(user?.name ?? 'Y').slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm truncate">{user?.name ?? 'Yogi'}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
