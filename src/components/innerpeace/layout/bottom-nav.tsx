'use client'

import { Home, Flower2, Brain, Sparkles, Menu } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { ViewKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { BarChart3, BookHeart, Settings, LogOut } from 'lucide-react'

const PRIMARY_NAV: Array<{ key: ViewKey; label: string; icon: typeof Home }> = [
  { key: 'dashboard', label: 'Home', icon: Home },
  { key: 'yoga', label: 'Yoga', icon: Flower2 },
  { key: 'meditation', label: 'Meditate', icon: Brain },
  { key: 'mantra', label: 'Mantra', icon: Sparkles },
]

export function BottomNav() {
  const { view, setView, signOut } = useAppStore()

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5">
        {PRIMARY_NAV.map((item) => {
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium min-h-[56px] transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium min-h-[56px] transition-colors',
                ['progress', 'journal', 'settings'].includes(view) ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-label="More sections"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 glass-strong">
            <SheetHeader>
              <SheetTitle className="font-elegant text-primary">More</SheetTitle>
            </SheetHeader>
            <div className="mt-2 flex flex-col gap-1">
              {(
                [
                  { key: 'progress', label: 'Progress', icon: BarChart3 },
                  { key: 'journal', label: 'Journal', icon: BookHeart },
                  { key: 'settings', label: 'Settings', icon: Settings },
                ] as Array<{ key: ViewKey; label: string; icon: typeof Home }>
              ).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground min-h-[44px]"
                >
                  <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
              <button
                onClick={signOut}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 min-h-[44px]"
              >
                <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
