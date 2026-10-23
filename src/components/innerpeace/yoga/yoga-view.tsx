'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flower2,
  Pause,
  Play,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { api, formatClock } from '@/lib/client'
import type { YogaRoutineDTO, YogaSessionDTO } from '@/lib/types'
import { ImageFallback } from '@/components/innerpeace/ui/image-fallback'
import { ProgressRing } from '@/components/innerpeace/ui/progress-ring'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'

const CATEGORIES = ['morning', 'evening', 'flexibility', 'strength', 'relaxation', 'breathing'] as const
const LEVEL_STYLE: Record<string, string> = {
  beginner: 'bg-primary/15 text-primary border-primary/30',
  intermediate: 'bg-gold/15 text-gold border-gold/30',
  advanced: 'bg-destructive/15 text-destructive border-destructive/30',
}

export function YogaView() {
  const [routines, setRoutines] = useState<YogaRoutineDTO[] | null>(null)
  const [recent, setRecent] = useState<YogaSessionDTO[]>([])
  const [level, setLevel] = useState('all')
  const [category, setCategory] = useState<string | null>(null)
  const [activeRoutine, setActiveRoutine] = useState<YogaRoutineDTO | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const [r, s] = await Promise.all([
          api.get<{ routines: YogaRoutineDTO[] }>('/api/yoga/routines'),
          api.get<{ sessions: YogaSessionDTO[] }>('/api/yoga/sessions?limit=5'),
        ])
        if (!cancelled) {
          setRoutines(r.routines)
          setRecent(s.sessions)
        }
      } catch {
        if (!cancelled) {
          toast({ title: 'Could not load routines', variant: 'destructive' })
          setRoutines([])
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const filtered = useMemo(() => {
    if (!routines) return []
    return routines.filter(
      (r) => (level === 'all' || r.level === level) && (!category || r.category === category)
    )
  }, [routines, level, category])

  const onFinished = () => {
    setActiveRoutine(null)
    setReloadKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {activeRoutine ? (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <SessionPlayer routine={activeRoutine} onExit={() => setActiveRoutine(null)} onFinished={onFinished} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
            {/* Banner */}
            <section className="relative rounded-3xl overflow-hidden h-44 sm:h-56">
              <ImageFallback
                src="/images/yoga-morning.png"
                alt="Morning yoga by the sea"
                className="absolute inset-0"
                overlay
              />
              <div className="relative h-full flex flex-col justify-end p-6 text-white">
                <h2 className="font-elegant text-2xl sm:text-3xl font-semibold">Yoga Practice</h2>
                <p className="text-white/85 text-sm mt-1">A healthy body leads to a peaceful mind.</p>
              </div>
            </section>

            {/* Filters */}
            <div className="flex flex-col gap-3">
              <Tabs value={level} onValueChange={setLevel}>
                <TabsList className="rounded-full self-start" aria-label="Difficulty level">
                  <TabsTrigger value="all" className="rounded-full">All</TabsTrigger>
                  <TabsTrigger value="beginner" className="rounded-full">Beginner</TabsTrigger>
                  <TabsTrigger value="intermediate" className="rounded-full">Intermediate</TabsTrigger>
                  <TabsTrigger value="advanced" className="rounded-full">Advanced</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory((cur) => (cur === c ? null : c))} aria-pressed={category === c}>
                    <Badge
                      variant="outline"
                      className={`capitalize cursor-pointer min-h-[32px] px-3 rounded-full transition-colors ${
                        category === c ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                      }`}
                    >
                      {c}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Routine grid */}
            {!routines ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-3xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
                <Flower2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">No routines match these filters yet.</p>
                <Button variant="outline" size="sm" onClick={() => { setLevel('all'); setCategory(null) }}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4) }}
                  >
                    <div className="glass rounded-3xl overflow-hidden h-full flex flex-col">
                      <ImageFallback src={`/images/${r.imageKey}.png`} alt={r.title} className="h-40" />
                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-elegant text-lg font-semibold leading-tight">{r.title}</h3>
                          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${LEVEL_STYLE[r.level] ?? ''}`}>
                            {r.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {r.durationMin} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> {r.poses.length} poses
                          </span>
                          <span className="capitalize">{r.category}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                        <Button className="mt-auto rounded-full" onClick={() => setActiveRoutine(r)}>
                          Start Session
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Recent practice */}
            <div className="glass rounded-3xl p-6">
              <h3 className="font-elegant text-xl font-semibold mb-4">Your Recent Practice</h3>
              {recent.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Flower2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">No sessions yet — roll out your mat and begin.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto nice-scroll pr-1">
                  {recent.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                          <Flower2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.routineTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.createdAt).toLocaleDateString()}{' '}
                            {s.completed ? '• completed' : '• partial'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary shrink-0">
                        {Math.round(s.durationSec / 60)} min
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*                        Session Player                               */
/* ------------------------------------------------------------------ */

function SessionPlayer({
  routine,
  onExit,
  onFinished,
}: {
  routine: YogaRoutineDTO
  onExit: () => void
  onFinished: () => void
}) {
  const [poseIdx, setPoseIdx] = useState(0)
  const [remaining, setRemaining] = useState(routine.poses[0]?.durationSec ?? 60)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const [elapsedTotal, setElapsedTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const savedRef = useRef(false)

  const pose = routine.poses[poseIdx]

  const finishSession = async (completed: boolean) => {
    if (savedRef.current) return
    savedRef.current = true
    setSaving(true)
    try {
      await api.post('/api/yoga/sessions', {
        routineId: routine.id,
        routineTitle: routine.title,
        durationSec: elapsedTotal,
        completed,
      })
      toast({ title: 'Session saved', description: `${routine.title} • ${Math.round(elapsedTotal / 60)} min` })
    } catch {
      toast({ title: 'Could not save session', variant: 'destructive' })
    } finally {
      setSaving(false)
      onFinished()
    }
  }

  // accurate countdown using timestamps
  const deadlineRef = useRef<number>(Date.now() + (routine.poses[0]?.durationSec ?? 60) * 1000)
  useEffect(() => {
    if (paused || finished) return
    const t = window.setInterval(() => {
      const now = Date.now()
      setElapsedTotal((e) => e + 1)
      const remainMs = deadlineRef.current - now
      if (remainMs <= 0) {
        // advance pose
        setPoseIdx((idx) => {
          if (idx >= routine.poses.length - 1) {
            setFinished(true)
            return idx
          }
          const next = idx + 1
          deadlineRef.current = Date.now() + routine.poses[next].durationSec * 1000
          setRemaining(routine.poses[next].durationSec)
          return next
        })
      } else {
        setRemaining(Math.ceil(remainMs / 1000))
      }
    }, 250)
    return () => window.clearInterval(t)
  }, [paused, finished, routine.poses])

  // when finishing naturally, auto-save
  useEffect(() => {
    if (finished) void finishSession(true)
     
  }, [finished])

  const goToPose = (idx: number) => {
    const clamped = Math.max(0, Math.min(routine.poses.length - 1, idx))
    setPoseIdx(clamped)
    setRemaining(routine.poses[clamped].durationSec)
    deadlineRef.current = Date.now() + routine.poses[clamped].durationSec * 1000
  }

  const poseProgress = 1 - remaining / Math.max(1, pose?.durationSec ?? 1)

  if (finished) {
    return (
      <div className="glass rounded-3xl p-10 flex flex-col items-center gap-5 text-center min-h-[420px] justify-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <CheckCircle2 className="h-20 w-20 text-primary" aria-hidden="true" />
        </motion.div>
        <h3 className="font-elegant text-3xl font-semibold text-primary">Session Complete</h3>
        <p className="text-muted-foreground max-w-sm">
          Beautiful practice. You spent {Math.max(1, Math.round(elapsedTotal / 60))} minutes with{' '}
          <span className="text-foreground font-medium">{routine.title}</span>.
        </p>
        {saving && <p className="text-xs text-muted-foreground">Saving your session…</p>}
        <Button onClick={onExit} className="rounded-full mt-2">
          Back to Routines
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onExit} aria-label="Back to routines">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-elegant text-xl font-semibold">{routine.title}</h2>
          <p className="text-xs text-muted-foreground">
            Pose {poseIdx + 1} of {routine.poses.length} • {routine.durationMin} min routine
          </p>
        </div>
        <div className="ml-auto flex gap-1">
          {routine.poses.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-5 rounded-full transition-colors ${i < poseIdx ? 'bg-primary' : i === poseIdx ? 'bg-gold' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pose visual + ring */}
        <div className="glass rounded-3xl overflow-hidden flex flex-col">
          <ImageFallback src={`/images/${routine.imageKey}.png`} alt={routine.title} className="h-56" />
          <div className="p-6 flex flex-col items-center gap-4">
            <ProgressRing progress={poseProgress} size={200} strokeWidth={10}>
              <span className="font-elegant text-4xl font-semibold">{formatClock(remaining)}</span>
              <span className="text-xs text-muted-foreground mt-1">{paused ? 'paused' : 'remaining'}</span>
            </ProgressRing>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-11 w-11"
                onClick={() => goToPose(poseIdx - 1)}
                disabled={poseIdx === 0}
                aria-label="Previous pose"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                className="rounded-full h-12 px-6 gap-2"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Resume' : 'Pause'}
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? 'Resume' : 'Pause'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-11 w-11"
                onClick={() => goToPose(poseIdx + 1)}
                disabled={poseIdx === routine.poses.length - 1}
                aria-label="Next pose"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => finishSession(false)}>
              Finish early & save
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex flex-col gap-4">
          <div className="glass rounded-3xl p-6">
            <h3 className="font-elegant text-2xl font-semibold">{pose.name}</h3>
            {pose.sanskritName && <p className="text-sm text-gold font-elegant italic">{pose.sanskritName}</p>}
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{pose.instructions}</p>
          </div>
          {pose.safety && (
            <div className="rounded-3xl border border-gold/30 bg-gold/10 p-5 flex gap-3">
              <ShieldAlert className="h-5 w-5 text-gold shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-gold">Safety note</p>
                <p className="text-sm text-foreground/80 mt-1">{pose.safety}</p>
              </div>
            </div>
          )}
          <details className="glass rounded-3xl p-5">
            <summary className="cursor-pointer text-sm font-medium">Benefits of this routine</summary>
            <ul className="mt-3 flex flex-col gap-2">
              {routine.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </details>
          <details className="glass rounded-3xl p-5">
            <summary className="cursor-pointer text-sm font-medium">Routine safety guidelines</summary>
            <ul className="mt-3 flex flex-col gap-2">
              {routine.safety.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-gold mt-0.5 shrink-0" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  )
}
