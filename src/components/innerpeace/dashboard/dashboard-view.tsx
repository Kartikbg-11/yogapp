'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Flower2,
  Brain,
  Sparkles,
  Flame,
  ArrowRight,
  Quote as QuoteIcon,
  RefreshCw,
  Timer,
  RotateCcw,
} from 'lucide-react'
import { api, todayKey } from '@/lib/client'
import { useAppStore } from '@/lib/store'
import { quoteOfDay, randomQuote, type Quote } from '@/lib/quotes'
import type { GoalDTO, PreferenceDTO, YogaSessionDTO, MeditationSessionDTO, ChantSessionDTO } from '@/lib/types'
import { ProgressRing } from '@/components/innerpeace/ui/progress-ring'
import { ImageFallback } from '@/components/innerpeace/ui/image-fallback'
import { Particles } from '@/components/innerpeace/ui/particles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

interface DashData {
  goal: GoalDTO | null
  streak: number
  recent: Array<{
    type: 'yoga' | 'meditation' | 'chant'
    title: string
    detail: string
    createdAt: string
  }>
}

export function DashboardView() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const preferences = useAppStore((s) => s.preferences)
  const setPreferences = useAppStore((s) => s.setPreferences)
  const [quote, setQuote] = useState<Quote>(() => quoteOfDay())
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [prefsRes, goalRes, summaryRes, yogaRes, medRes, chantRes] = await Promise.all([
          preferences
            ? Promise.resolve({ preferences })
            : api.get<{ preferences: PreferenceDTO }>('/api/preferences'),
          api.get<{ goal: GoalDTO }>(`/api/goals?date=${todayKey()}`),
          api.get<{ summary: { streak: { current: number } } }>('/api/analytics/summary?days=7'),
          api.get<{ sessions: YogaSessionDTO[] }>('/api/yoga/sessions?limit=5'),
          api.get<{ sessions: MeditationSessionDTO[] }>('/api/meditation/sessions?limit=5'),
          api.get<{ sessions: ChantSessionDTO[] }>('/api/chant-sessions?limit=5'),
        ])
        if (cancelled) return
        if (!preferences) setPreferences(prefsRes.preferences)
        const merged = [
          ...yogaRes.sessions.map((s) => ({
            type: 'yoga' as const,
            title: s.routineTitle,
            detail: `${Math.round(s.durationSec / 60)} min practice`,
            createdAt: s.createdAt,
          })),
          ...medRes.sessions.map((s) => ({
            type: 'meditation' as const,
            title: 'Meditation',
            detail: `${Math.round(s.durationSec / 60)} min sit`,
            createdAt: s.createdAt,
          })),
          ...chantRes.sessions.map((s) => ({
            type: 'chant' as const,
            title: s.mantraName,
            detail: `${s.count} chants`,
            createdAt: s.createdAt,
          })),
        ]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6)
        setData({ goal: goalRes.goal, streak: summaryRes.summary.streak.current, recent: merged })
      } catch {
        if (!cancelled) toast({ title: 'Could not load dashboard', variant: 'destructive' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
     
  }, [])

  const goal = data?.goal
  const yogaPct = goal ? Math.min(1, goal.yogaDone / Math.max(1, goal.yogaTarget)) : 0
  const medPct = goal ? Math.min(1, goal.meditationDone / Math.max(1, goal.meditationTarget)) : 0
  const chantPct = goal ? Math.min(1, goal.chantDone / Math.max(1, goal.chantTarget)) : 0

  const suggestions: Array<{ label: string; view: 'yoga' | 'meditation' | 'mantra'; reason: string }> = []
  if (goal) {
    if (goal.yogaDone < goal.yogaTarget)
      suggestions.push({ label: 'Morning flow', view: 'yoga', reason: 'Your yoga session awaits' })
    if (goal.meditationDone < goal.meditationTarget)
      suggestions.push({ label: 'Guided meditation', view: 'meditation', reason: `${goal.meditationTarget - goal.meditationDone} min to your goal` })
    if (goal.chantDone < goal.chantTarget)
      suggestions.push({ label: 'Mantra chanting', view: 'mantra', reason: `${goal.chantTarget - goal.chantDone} chants remaining` })
  }
  if (suggestions.length === 0) {
    suggestions.push({ label: 'Deep flexibility', view: 'yoga', reason: 'You are on top of your goals today' })
  }

  const FEATURES = [
    {
      key: 'yoga' as const,
      title: 'Yoga',
      desc: 'Build a healthier body and calmer mind',
      img: '/images/yoga-morning.png',
      icon: Flower2,
      cta: 'Start Practice',
    },
    {
      key: 'meditation' as const,
      title: 'Meditation',
      desc: 'Find inner peace and reduce stress',
      img: '/images/meditation-lake.png',
      icon: Brain,
      cta: 'Start Practice',
    },
    {
      key: 'mantra' as const,
      title: 'Mantra Chanting',
      desc: 'Connect with divine energy and positive vibes',
      img: '/images/mantra-shiva.png',
      icon: Sparkles,
      cta: 'Start Chanting',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section aria-label="Daily welcome" className="relative rounded-3xl overflow-hidden min-h-[340px] sm:min-h-[400px] flex flex-col justify-end">
        <ImageFallback
          src="/images/hero-sunrise.png"
          alt="Woman meditating on a mountain cliff at golden sunrise"
          className="absolute inset-0"
          overlay
        />
        <Particles count={16} />
        <div className="relative p-6 sm:p-10 text-white max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-elegant text-3xl sm:text-4xl font-semibold"
          >
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Yogi'}
          </motion.h2>
          <p className="mt-2 text-white/85 text-sm sm:text-base">
            Take a deep breath. Today is a new opportunity to be a better you.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" className="rounded-full gap-1.5" onClick={() => setView('yoga')}>
              <Flower2 className="h-4 w-4" /> Start Yoga
            </Button>
            <Button
              size="sm"
              className="rounded-full gap-1.5 bg-white/15 text-white hover:bg-white/25 backdrop-blur"
              onClick={() => setView('meditation')}
            >
              <Brain className="h-4 w-4" /> Meditate
            </Button>
            <Button
              size="sm"
              className="rounded-full gap-1.5 bg-white/15 text-white hover:bg-white/25 backdrop-blur"
              onClick={() => setView('mantra')}
            >
              <Sparkles className="h-4 w-4" /> Chant
            </Button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section aria-label="Features" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <div className="glass rounded-3xl overflow-hidden h-full flex flex-col">
              <ImageFallback src={f.img} alt={f.title} className="h-36" />
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-elegant text-lg font-semibold">{f.title}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-auto rounded-full gap-2 group"
                  onClick={() => setView(f.key)}
                >
                  {f.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Today's progress + quote */}
      <section aria-label="Today's progress" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-elegant text-xl font-semibold">Today&rsquo;s Progress</h3>
            <span className="text-xs text-muted-foreground">{todayKey()}</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-2">
                <ProgressRing progress={yogaPct} size={104} strokeWidth={7}>
                  <Flower2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold mt-1">
                    {goal?.yogaDone ?? 0}/{goal?.yogaTarget ?? 1}
                  </span>
                </ProgressRing>
                <p className="text-xs text-muted-foreground">Yoga sessions</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ProgressRing progress={medPct} size={104} strokeWidth={7} color="var(--chart-3)">
                  <Brain className="h-5 w-5 text-teal-glow" aria-hidden="true" />
                  <span className="text-sm font-semibold mt-1">
                    {goal?.meditationDone ?? 0}/{goal?.meditationTarget ?? 10}m
                  </span>
                </ProgressRing>
                <p className="text-xs text-muted-foreground">Meditation minutes</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ProgressRing progress={chantPct} size={104} strokeWidth={7} color="var(--gold)">
                  <Sparkles className="h-5 w-5 text-gold" aria-hidden="true" />
                  <span className="text-sm font-semibold mt-1">
                    {goal?.chantDone ?? 0}/{goal?.chantTarget ?? 108}
                  </span>
                </ProgressRing>
                <p className="text-xs text-muted-foreground">Mantra counts</p>
              </div>
            </div>
          )}
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-secondary/60 p-4">
            <div className="h-10 w-10 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {data?.streak ?? 0} day streak{data?.streak === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-muted-foreground">
                {data?.streak ? 'Keep the flame alive — practice again today.' : 'Complete a session today to start a streak.'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden min-h-[260px]">
          <ImageFallback
            src="/images/lake-quotes.png"
            alt="Misty mountain lake at dawn"
            className="absolute inset-0"
            overlay
          />
          <div className="relative h-full flex flex-col justify-end p-6 text-white">
            <QuoteIcon className="h-6 w-6 text-gold mb-2" aria-hidden="true" />
            <p className="font-elegant text-lg leading-snug">&ldquo;{quote.text}&rdquo;</p>
            <p className="mt-2 text-sm text-white/75">— {quote.author}</p>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              aria-label="Show another quote"
              onClick={() => setQuote((q) => randomQuote(q))}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Recent + suggestions */}
      <section aria-label="Recent activity and suggestions" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-elegant text-xl font-semibold mb-4">Recently Completed</h3>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : data && data.recent.length > 0 ? (
            <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto nice-scroll pr-1">
              {data.recent.map((r, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      r.type === 'yoga'
                        ? 'bg-primary/15 text-primary'
                        : r.type === 'meditation'
                          ? 'bg-teal-glow/15 text-teal-glow'
                          : 'bg-gold/15 text-gold'
                    }`}
                  >
                    {r.type === 'yoga' ? (
                      <Flower2 className="h-4 w-4" />
                    ) : r.type === 'meditation' ? (
                      <Timer className="h-4 w-4" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                No sessions yet — your journey begins with a single breath.
              </p>
              <Button size="sm" variant="outline" onClick={() => setView('meditation')}>
                Begin Meditation
              </Button>
            </div>
          )}
        </div>

        <div className="glass rounded-3xl p-6">
          <h3 className="font-elegant text-xl font-semibold mb-4">Suggested For You</h3>
          <div className="flex flex-col gap-3">
            {suggestions.slice(0, 3).map((s, i) => (
              <motion.button
                key={s.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setView(s.view)}
                className="flex items-center justify-between rounded-2xl bg-secondary/50 p-4 text-left hover:bg-accent transition-colors min-h-[64px]"
              >
                <div>
                  <p className="font-medium text-sm">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
              </motion.button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Based on your goals and today&rsquo;s progress so far.
          </p>
        </div>
      </section>
    </div>
  )
}
