'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BellOff,
  Brain,
  CloudRain,
  Expand,
  Heart,
  Maximize2,
  Pause,
  Play,
  TreePine,
  Volume2,
  VolumeX,
  Waves,
  Wind,
} from 'lucide-react'
import { api, formatClock } from '@/lib/client'
import type { MeditationSessionDTO } from '@/lib/types'
import { playAmbient, stopAmbient, setAmbientVolume, playBell } from '@/lib/ambient'
import { ImageFallback } from '@/components/innerpeace/ui/image-fallback'
import { ProgressRing } from '@/components/innerpeace/ui/progress-ring'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

const DURATIONS = [1, 3, 5, 10, 15, 20, 30]

const AMBIENTS: Array<{ kind: 'forest' | 'ocean' | 'rain' | 'wind' | 'bells'; label: string; icon: typeof TreePine }> = [
  { kind: 'forest', label: 'Nature', icon: TreePine },
  { kind: 'ocean', label: 'Ocean', icon: Waves },
  { kind: 'rain', label: 'Rain', icon: CloudRain },
  { kind: 'wind', label: 'Wind', icon: Wind },
  { kind: 'bells', label: 'Bells', icon: Bell },
]

/* breathing phase cycle: inhale 4s, hold 4s, exhale 6s */
const PHASES = [
  { name: 'Breathe In', duration: 4, scale: 1.12 },
  { name: 'Hold', duration: 4, scale: 1.12 },
  { name: 'Breathe Out', duration: 6, scale: 0.82 },
] as const

function useBreathingPhase(running: boolean) {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [phaseLeft, setPhaseLeft] = useState(PHASES[0].duration)
  const startedAtRef = useRef<number | null>(null)
  const pausedAccumRef = useRef(0)
  const pausedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) {
      if (startedAtRef.current !== null && pausedAtRef.current === null) {
        pausedAtRef.current = Date.now()
      }
      return
    }
    if (startedAtRef.current === null) startedAtRef.current = Date.now()
    if (pausedAtRef.current !== null) {
      pausedAccumRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = null
    }
    const t = window.setInterval(() => {
      const elapsed = (Date.now() - (startedAtRef.current ?? Date.now()) - pausedAccumRef.current) / 1000
      let remaining = elapsed
      let idx = 0
      for (let i = 0; i < PHASES.length; i++) {
        if (remaining < PHASES[i].duration) {
          idx = i
          break
        }
        remaining -= PHASES[i].duration
        idx = (i + 1) % PHASES.length
      }
      const phase = PHASES[idx]
      const leftInPhase = Math.ceil(phase.duration - remaining)
      setPhaseIdx(idx)
      setPhaseLeft(Math.max(1, leftInPhase))
    }, 200)
    return () => window.clearInterval(t)
  }, [running])

  return { phase: PHASES[phaseIdx], phaseLeft }
}

export function MeditationView() {
  const [minutes, setMinutes] = useState(10)
  const [ambient, setAmbient] = useState<'forest' | 'ocean' | 'rain' | 'wind' | 'bells' | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [muted, setMuted] = useState(false)
  const [intervalBells, setIntervalBells] = useState(false)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [recent, setRecent] = useState<MeditationSessionDTO[] | null>(null)
  const [saving, setSaving] = useState(false)

  const plannedSec = minutes * 60
  const savedRef = useRef(false)
  const lastBellRef = useRef(0)
  const { phase, phaseLeft } = useBreathingPhase(running && !paused)

  const loadRecent = useCallback(async () => {
    try {
      const res = await api.get<{ sessions: MeditationSessionDTO[] }>('/api/meditation/sessions?limit=6')
      setRecent(res.sessions)
    } catch {
      setRecent([])
    }
  }, [])

  useEffect(() => {
    loadRecent()
  }, [loadRecent])

  /* master timer (timestamp-based) */
  const startRef = useRef<number | null>(null)
  const pausedTotalRef = useRef(0)
  const pausedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      if (paused) return
      if (startRef.current === null) startRef.current = Date.now()
      const elapsed = Math.floor((Date.now() - startRef.current - pausedTotalRef.current) / 1000)
      setElapsedSec(elapsed)
      // interval bells every 5 minutes
      if (intervalBells && Math.floor(elapsed / 300) > lastBellRef.current) {
        lastBellRef.current = Math.floor(elapsed / 300)
        playBell(0.35)
      }
      if (elapsed >= plannedSec) {
        completeSession(true, elapsed)
      }
    }, 250)
    return () => window.clearInterval(t)
     
  }, [running, paused, plannedSec, intervalBells])

  const saveSession = useCallback(
    async (didComplete: boolean, sec: number) => {
      if (savedRef.current || sec < 30) {
        if (sec < 30) stopAmbient()
        return
      }
      savedRef.current = true
      setSaving(true)
      try {
        await api.post('/api/meditation/sessions', {
          plannedSec,
          durationSec: sec,
          ambient: ambient ?? undefined,
          completed: didComplete,
        })
        toast({
          title: didComplete ? 'Meditation complete 🙏' : 'Session saved',
          description: `${Math.round(sec / 60)} minutes of stillness recorded.`,
        })
        loadRecent()
      } catch {
        toast({ title: 'Could not save session', variant: 'destructive' })
      } finally {
        setSaving(false)
      }
    },
    [ambient, plannedSec, loadRecent]
  )

  const completeSession = (didComplete: boolean, sec: number) => {
    setRunning(false)
    setPaused(false)
    stopAmbient()
    if (didComplete) playBell(0.5)
    setCompleted(true)
    void saveSession(didComplete, sec)
  }

  const start = () => {
    savedRef.current = false
    startRef.current = Date.now()
    pausedTotalRef.current = 0
    pausedAtRef.current = null
    lastBellRef.current = 0
    setElapsedSec(0)
    setCompleted(false)
    setRunning(true)
    setPaused(false)
    if (ambient) playAmbient(ambient)
    playBell(0.25)
  }

  const togglePause = () => {
    if (!running) return
    if (!paused) {
      pausedAtRef.current = Date.now()
      setPaused(true)
      stopAmbient()
    } else {
      if (pausedAtRef.current) pausedTotalRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = null
      setPaused(false)
      if (ambient) playAmbient(ambient)
    }
  }

  const finish = () => {
    const sec =
      startRef.current !== null
        ? Math.floor(
            ((pausedAtRef.current ?? Date.now()) - startRef.current - pausedTotalRef.current) / 1000
          )
        : 0
    completeSession(false, sec)
  }

  const reset = () => {
    setRunning(false)
    setPaused(false)
    setCompleted(false)
    setElapsedSec(0)
    stopAmbient()
  }

  useEffect(() => {
    return () => stopAmbient()
  }, [])

  const chooseAmbient = (kind: 'forest' | 'ocean' | 'rain' | 'wind' | 'bells') => {
    setAmbient((cur) => {
      const next = cur === kind ? null : kind
      if (running && !paused) {
        stopAmbient()
        if (next) playAmbient(next)
      }
      return next
    })
  }

  const changeVolume = (v: number) => {
    setVolume(v)
    setMuted(v === 0)
    setAmbientVolume(muted ? v : v)
  }

  const toggleMute = () => {
    setMuted((m) => {
      setAmbientVolume(m ? volume : 0)
      return !m
    })
  }

  const remaining = Math.max(0, plannedSec - elapsedSec)
  const progress = Math.min(1, elapsedSec / plannedSec)

  const RingBlock = (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center">
        {/* breathing halo */}
        <motion.div
          className="absolute rounded-full bg-primary/10"
          style={{ width: 320, height: 320 }}
          animate={
            running && !paused
              ? { scale: phase.scale, opacity: 0.9 }
              : { scale: 0.9, opacity: 0.4 }
          }
          transition={
            running && !paused
              ? { duration: phase.duration, ease: phase.name === 'Hold' ? 'linear' : 'easeInOut' }
              : { duration: 0.5 }
          }
        />
        <ProgressRing progress={progress} size={260} strokeWidth={12} animate={!running}>
          {running ? (
            <>
              <span className="font-elegant text-4xl font-semibold">{formatClock(remaining)}</span>
              <span className="mt-1 text-sm text-primary font-medium">{phase.name}</span>
              <span className="text-xs text-muted-foreground">{phaseLeft}s</span>
            </>
          ) : completed ? (
            <>
              <Heart className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="mt-2 text-sm text-muted-foreground">{Math.round(elapsedSec / 60)} min of stillness</span>
            </>
          ) : (
            <>
              <span className="font-elegant text-4xl font-semibold text-muted-foreground">{minutes}:00</span>
              <span className="mt-1 text-xs text-muted-foreground">Tap to start</span>
            </>
          )}
        </ProgressRing>
      </div>

      <div className="flex items-center gap-3">
        {!running ? (
          <Button className="rounded-full h-14 px-8 text-base gap-2" onClick={start} disabled={saving}>
            <Play className="h-5 w-5" /> Begin Meditation
          </Button>
        ) : (
          <>
            <Button className="rounded-full h-12 px-6 gap-2" onClick={togglePause}>
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="outline" className="rounded-full h-12 px-6" onClick={finish}>
              Finish
            </Button>
          </>
        )}
      </div>
      {running && !paused && (
        <p className="text-xs text-muted-foreground">
          {phase.name === 'Breathe In'
            ? 'Inhale slowly through your nose…'
            : phase.name === 'Hold'
              ? 'Hold gently, no strain…'
              : 'Exhale softly, release everything…'}
        </p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <section className="relative rounded-3xl overflow-hidden h-44 sm:h-56">
        <ImageFallback
          src="/images/meditation-lake.png"
          alt="Meditating by a misty lake"
          className="absolute inset-0"
          overlay
        />
        <div className="relative h-full flex flex-col justify-end p-6 text-white">
          <h2 className="font-elegant text-2xl sm:text-3xl font-semibold">Meditation</h2>
          <p className="text-white/85 text-sm mt-1">Calm your mind, find your center.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Timer card */}
        <div className="lg:col-span-3 glass rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Session duration">
            {DURATIONS.map((m) => (
              <button
                key={m}
                onClick={() => !running && setMinutes(m)}
                disabled={running}
                aria-pressed={minutes === m}
                className={`rounded-full px-4 min-h-[40px] text-sm font-medium transition-colors disabled:opacity-50 ${
                  minutes === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
          {RingBlock}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <Expand className="h-4 w-4" /> Distraction-free mode
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl glass-strong rounded-3xl">
              <DialogTitle className="sr-only">Meditation timer full screen</DialogTitle>
              <div className="relative rounded-2xl overflow-hidden p-8 flex flex-col items-center gap-6">
                <ImageFallback
                  src="/images/meditation-lake.png"
                  alt=""
                  className="absolute inset-0"
                  overlay
                />
                <div className="relative">{RingBlock}</div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Ambient controls */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass rounded-3xl p-6">
            <h3 className="font-elegant text-lg font-semibold mb-1">Ambient Soundscape</h3>
            <p className="text-xs text-muted-foreground mb-4">Synthesized live — works everywhere, offline too.</p>
            <div className="grid grid-cols-5 gap-2">
              {AMBIENTS.map((a) => {
                const active = ambient === a.kind
                return (
                  <button
                    key={a.kind}
                    onClick={() => chooseAmbient(a.kind)}
                    aria-pressed={active}
                    aria-label={`${a.label} sounds`}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 min-h-[64px] transition-colors ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <a.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[10px] font-medium">{a.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[muted ? 0 : Math.round(volume * 100)]}
                max={100}
                step={5}
                onValueChange={(v) => changeVolume((v[0] ?? 50) / 100)}
                aria-label="Ambient volume"
              />
            </div>
            <button
              onClick={() => setIntervalBells((b) => !b)}
              aria-pressed={intervalBells}
              className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                intervalBells ? 'bg-gold/15 text-gold' : 'bg-secondary/60 text-muted-foreground hover:bg-accent'
              }`}
            >
              {intervalBells ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              Interval bells every 5 min {intervalBells ? 'on' : 'off'}
            </button>
          </div>

          <div className="glass rounded-3xl p-6">
            <h3 className="font-elegant text-lg font-semibold mb-4">Recent Sessions</h3>
            {!recent ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-11 rounded-xl" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Brain className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">No sits yet — even one mindful minute counts.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto nice-scroll pr-1">
                {recent.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-teal-glow/15 text-teal-glow flex items-center justify-center">
                        <Maximize2 className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{Math.round(s.durationSec / 60)} min</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {s.ambient ? `${s.ambient} • ` : ''}
                          {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {s.completed && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-1">
                        complete
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
