'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/client'
import type { UserDTO } from '@/lib/types'
import { Sidebar } from '@/components/innerpeace/layout/sidebar'
import { BottomNav } from '@/components/innerpeace/layout/bottom-nav'
import { TopBar } from '@/components/innerpeace/layout/topbar'
import { Footer } from '@/components/innerpeace/layout/footer'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthView } from '@/components/innerpeace/auth/auth-view'
import { DashboardView } from '@/components/innerpeace/dashboard/dashboard-view'
import { YogaView } from '@/components/innerpeace/yoga/yoga-view'
import { MeditationView } from '@/components/innerpeace/meditation/meditation-view'
import { ChantView } from '@/components/innerpeace/mantra/chant-view'
import { ProgressView } from '@/components/innerpeace/progress/progress-view'
import { JournalView } from '@/components/innerpeace/journal/journal-view'
import { SettingsView } from '@/components/innerpeace/settings/settings-view'

export function InnerPeaceApp() {
  const { token, hydrated, view, hydrate, signIn } = useAppStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Revalidate stored token silently; if invalid, api client clears auth.
  useEffect(() => {
    if (!hydrated || !token) return
    api
      .get<{ user: UserDTO }>('/api/auth/me')
      .then((res) => {
        if (res.user) signIn(token, res.user)
      })
      .catch(() => {
        /* token invalid — auth view will show */
      })
     
  }, [hydrated])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 animate-pulse" />
          <p className="font-elegant text-xl text-primary">InnerPeace</p>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <AuthView />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <div className="min-h-screen flex bg-background" id="innerpeace-root">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <TopBar />
          <main key={view} className="view-enter flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 w-full max-w-7xl mx-auto">
            {view === 'dashboard' && <DashboardView />}
            {view === 'yoga' && <YogaView />}
            {view === 'meditation' && <MeditationView />}
            {view === 'mantra' && <ChantView />}
            {view === 'progress' && <ProgressView />}
            {view === 'journal' && <JournalView />}
            {view === 'settings' && <SettingsView />}
          </main>
          <Footer />
          <BottomNav />
        </div>
      </div>
    </ThemeProvider>
  )
}
