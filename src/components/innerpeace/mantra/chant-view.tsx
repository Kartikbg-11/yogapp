'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Timer,
  Trash2,
  Undo2,
} from 'lucide-react'
import { api, todayKey } from '@/lib/client'
import { useAppStore } from '@/lib/store'
import type { ChantSessionDTO, MantraDTO } from '@/lib/types'
import { haptic, playBell, playTick } from '@/lib/ambient'
import { ImageFallback } from '@/components/innerpeace/ui/image-fallback'
import { Particles } from '@/components/innerpeace/ui/particles'
import { ProgressRing } from '@/components/innerpeace/ui/progress-ring'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

const TARGETS = [27, 54, 108, 216, 1008]

/* ---------------- Mala bead ring ---------------- */
function MalaRing({ fill, size = 300 }: { fill: number; size?: number }) {
  const beads = 54 // every other bead drawn for elegance
  const radius = size / 2 - 14
  const center = size / 2
  const filled = Math.round(fill * beads)
  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
      {Array.from({ length: beads }, (_, i) => {
        const angle = (i / beads) * Math.PI * 2
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)
        const isFilled = i < filled
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 6 === 0 ? 5.5 : 4}
            fill={isFilled ? 'var(--gold)' : 'color-mix(in oklab, var(--gold) 22%, transparent)'}
            className={isFilled ? 'mala-bead' : undefined}
          />
        )
      })}
    </svg>
  )
}

/* ---------------- Completion celebration ---------------- */
function CompletionOverlay({
  rounds,
  count,
  onContinue,
  onFinish,
}: {
  rounds: number
  count: number
  onContinue: () => void
  onFinish: () => void
}) {
  const burst = Array.from({ length: 28 }, (_, i) => i)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
      role="dialog"
      aria-label="Mala complete"
    >
      <Particles count={20} className="z-0" />
      {burst.map((i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            background: i % 3 === 0 ? 'var(--gold)' : 'var(--primary)',
            left: '50%',
            top: '50%',
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.4, 0],
            x: Math.cos((i / burst.length) * Math.PI * 2) * (160 + (i % 5) * 40),
            y: Math.sin((i / burst.length) * Math.PI * 2) * (160 + (i % 5) * 40),
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1.6, delay: 0.15, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.1 }}
        className="relative z-10 glass-strong rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center flex flex-col items-center gap-4"
      >
        <div className="h-20 w-20 rounded-full bg-gold/15 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-gold" aria-hidden="true" />
        </div>
        <h3 className="font-elegant text-3xl font-semibold shimmer-text">Mala Complete!</h3>
        <p className="text-sm text-muted-foreground">
          You chanted <span className="text-foreground font-semibold">{count}</span> repetitions —
          <span className="text-gold font-semibold"> {rounds} mala round{rounds === 1 ? '' : 's'}</span> of devotion.
        </p>
        <div className="flex gap-3 w-full mt-2">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onContinue}>
            Continue chanting
          </Button>
          <Button className="flex-1 rounded-full" onClick={onFinish}>
            Finish session
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */

export function ChantView() {
  const user = useAppStore((s) => s.user)
  const preferences = useAppStore((s) => s.preferences)
  const setPreferences = useAppStore((s) => s.setPreferences)

  const [mantras, setMantras] = useState<MantraDTO[] | null>(null)
  const [selectedMantraId, setSelectedMantraId] = useState<string>('')
  const [target, setTarget] = useState<number>(108)
  const [count, setCount] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [paused, setPaused] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [todayChants, setTodayChants] = useState(0)
  const [creating, setCreating] = useState(false)
  const [showNewMantra, setShowNewMantra] = useState(false)
  const [saving, setSaving] = useState(false)

  const celebratedRef = useRef(false)
  const saveTimerRef = useRef<number | null>(null)
  const stateRef = useRef({ count: 0, elapsedSec: 0, sessionId: null as string | null })
  stateRef.current = { count, elapsedSec, sessionId }

  /* load mantras + preferences target + restore active session */
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [mRes, prefsRes] = await Promise.all([
          api.get<{ mantras: MantraDTO[] }>('/api/mantras'),
          preferences ? Promise.resolve({ preferences }) : api.get<{ preferences: NonNullable<typeof preferences> }>('/api/preferences'),
        ])
        if (cancelled) return
        setMantras(mRes.mantras)
        if (!preferences) setPreferences(prefsRes.preferences)
        const initialId = prefsRes.preferences.preferredMantraId ?? mRes.mantras[0]?.id ?? ''
        setSelectedMantraId(initialId)
        const t = prefsRes.preferences.defaultChantTarget
        setTarget(TARGETS.includes(t) ? t : 108)

        // restore unfinished session from last 24h
        const activeRes = await api.get<{ active: ChantSessionDTO | null }>('/api/chant-sessions?active=1')
        if (!cancelled && activeRes.active) {
          const s = activeRes.active
          setSessionId(s.id)
          setCount(s.count)
          setTarget(s.target)
          if (s.mantraId && mRes.mantras.some((m) => m.id === s.mantraId)) setSelectedMantraId(s.mantraId)
          const idleSec = Math.floor((Date.now() - new Date(s.updatedAt).getTime()) / 1000)
          setElapsedSec(s.durationSec + Math.min(idleSec, 600))
          celebratedRef.current = s.count >= s.target
          toast({
            title: 'Session restored',
            description: `${s.mantraName} • ${s.count} chants continued.`,
          })
        }
      } catch {
        if (!cancelled) toast({ title: 'Could not load mantras', variant: 'destructive' })
        setMantras([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
     
  }, [])

  /* today's total */
  useEffect(() => {
    api
      .get<{ goal: { chantDone: number } }>(`/api/goals?date=${todayKey()}`)
      .then((r) => setTodayChants(r.goal.chantDone))
      .catch(() => {})
  }, [count])

  /* session timer */
  useEffect(() => {
    if (!sessionId || paused || celebrating) return
    const t = window.setInterval(() => setElapsedSec((e) => e + 1), 1000)
    return () => window.clearInterval(t)
  }, [sessionId, paused, celebrating])

  /* debounced persistence (absolute values → idempotent, no double counting) */
  const persist = useCallback(async (immediate = false) => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    const doSave = async () => {
      const s = stateRef.current
      if (!s.sessionId) return
      try {
        await api.patch(`/api/chant-sessions/${s.sessionId}`, {
          count: s.count,
          durationSec: s.elapsedSec,
        })
      } catch {
        /* silent — retried on next change */
      }
    }
    if (immediate) await doSave()
    else saveTimerRef.current = window.setTimeout(doSave, 1500)
  }, [])

  /* save on hide/unload */
  useEffect(() => {
    const onHide = () => void persist(true)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide()
    })
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [persist])

  const selectedMantra = mantras?.find((m) => m.id === selectedMantraId)

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (stateRef.current.sessionId) return stateRef.current.sessionId
    const id = crypto.randomUUID()
    try {
      const res = await api.post<{ session: ChantSessionDTO }>('/api/chant-sessions', {
        id,
        mantraId: selectedMantraId || undefined,
        mantraName: selectedMantra?.name ?? 'Om',
        target,
      })
      setSessionId(res.session.id)
      stateRef.current.sessionId = res.session.id
      return res.session.id
    } catch {
      toast({ title: 'Could not start session sync', description: 'Counts still work locally; will retry.', variant: 'destructive' })
      return null
    }
  }, [selectedMantraId, selectedMantra, target])

  const setCountSafe = (next: number) => {
    const clamped = Math.max(0, next)
    setCount(clamped)
    if (clamped >= target && !celebratedRef.current) {
      celebratedRef.current = true
      setCelebrating(true)
      if (preferences?.soundEnabled !== false) playBell(0.5)
      haptic([40, 60, 40])
      void persist(true)
    }
  }

  const increment = useCallback(() => {
    const next = stateRef.current.count + 1
    setCountSafe(next)
    if (preferences?.soundEnabled !== false) playTick(0.2)
    if (preferences?.hapticsEnabled !== false) haptic(8)
    void (async () => {
      const sid = await ensureSession()
      if (sid) void persist()
    })()
     
  }, [ensureSession, persist, preferences, target])

  /* keyboard: space/enter increments */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        increment()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [increment])

  const undo = () => {
    setCountSafe(stateRef.current.count - 1)
    void persist()
  }

  const reset = () => {
    setCountSafe(0)
    setElapsedSec(0)
    setPaused(false)
    void persist(true)
  }

  const changeTarget = (t: number) => {
    setTarget(t)
    celebratedRef.current = count >= t
    if (sessionId) {
      void api.patch(`/api/chant-sessions/${sessionId}`, { count, target: t }).catch(() => {})
    }
  }

  const changeMantra = (id: string) => {
    setSelectedMantraId(id)
    if (preferences && preferences.preferredMantraId !== id) {
      const patched = { ...preferences, preferredMantraId: id }
      setPreferences(patched)
      void api.patch('/api/preferences', { preferredMantraId: id }).catch(() => {})
    }
  }

  const finishSession = async () => {
    setPaused(true)
    setSaving(true)
    try {
      const sid = await ensureSession()
      if (sid) {
        await api.patch(`/api/chant-sessions/${sid}`, {
          count,
          durationSec: elapsedSec,
          completed: count >= target,
        })
      }
      toast({
        title: 'Session saved 🙏',
        description: `${count} chants of ${selectedMantra?.name ?? 'mantra'} in ${Math.max(1, Math.round(elapsedSec / 60))} min.`,
      })
      // reset for a fresh session
      setCount(0)
      setElapsedSec(0)
      setSessionId(null)
      stateRef.current.sessionId = null
      celebratedRef.current = false
      setPaused(false)
    } catch {
      toast({ title: 'Could not finish session', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteCustom = async (id: string) => {
    try {
      await api.delete(`/api/mantras/${id}`)
      setMantras((ms) => (ms ?? []).filter((m) => m.id !== id))
      if (selectedMantraId === id) {
        const first = mantras?.find((m) => m.id !== id)
        setSelectedMantraId(first?.id ?? '')
      }
      toast({ title: 'Custom mantra deleted' })
    } catch {
      toast({ title: 'Could not delete mantra', variant: 'destructive' })
    }
  }

  const createMantra = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const text = String(form.get('text') ?? '').trim()
    const meaning = String(form.get('meaning') ?? '').trim()
    if (name.length < 2 || !text) {
      toast({ title: 'Name and text are required', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await api.post<{ mantra: MantraDTO }>('/api/mantras', { name, text, meaning })
      setMantras((ms) => [res.mantra, ...(ms ?? [])])
      setSelectedMantraId(res.mantra.id)
      setShowNewMantra(false)
      toast({ title: 'Custom mantra added', description: name })
    } catch {
      toast({ title: 'Could not create mantra', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const rounds = Math.floor(count / target)
  const fill = target > 0 ? Math.min(1, (count % target || (count > 0 && count % target === 0 ? target : 0)) / target) : 0
  const effectiveFill = count > 0 && count % target === 0 ? 1 : fill
  const pct = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <section className="relative rounded-3xl overflow-hidden h-44 sm:h-52">
        <ImageFallback
          src="/images/mantra-shiva.png"
          alt="Golden Om ambiance with oil lamps"
          className="absolute inset-0"
          overlay
        />
        <div className="relative h-full flex flex-col justify-end p-6 text-white">
          <h2 className="font-elegant text-2xl sm:text-3xl font-semibold">Mantra Chanting</h2>
          <p className="text-white/85 text-sm mt-1">Chant with faith, feel the power.</p>
          <div className="absolute right-6 bottom-6 flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-gold" aria-hidden="true" />
            <span>{todayChants} chants today</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Controls column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-elegant text-lg font-semibold">Choose your mantra</h3>
              <Dialog open={showNewMantra} onOpenChange={setShowNewMantra}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> New
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-elegant">Create a custom mantra</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={createMantra} className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="m-name">Name</Label>
                      <Input id="m-name" name="name" placeholder="My morning mantra" required minLength={2} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="m-text">Mantra text</Label>
                      <Textarea id="m-text" name="text" placeholder="ॐ ... (any words sacred to you)" required className="min-h-20" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="m-meaning">Meaning (optional)</Label>
                      <Input id="m-meaning" name="meaning" placeholder="What does it mean to you?" />
                    </div>
                    <Button type="submit" disabled={creating} className="rounded-full">
                      {creating && <Loader2 className="h-4 w-4 animate-spin" />} Add mantra
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={selectedMantraId} onValueChange={changeMantra}>
              <SelectTrigger className="w-full min-h-[48px] rounded-xl" aria-label="Select mantra">
                <SelectValue placeholder="Select a mantra" />
              </SelectTrigger>
              <SelectContent>
                {mantras?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                    {m.isCustom ? ' • custom' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMantra && (
              <div className="mt-4 text-center">
                <p className="font-elegant text-xl text-gold leading-relaxed">{selectedMantra.text}</p>
                {selectedMantra.meaning && (
                  <p className="mt-2 text-xs text-muted-foreground italic">{selectedMantra.meaning}</p>
                )}
              </div>
            )}

            {selectedMantra?.isCustom && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-3 text-destructive gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" /> Delete this mantra
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-strong rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete custom mantra?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This only removes it from your list. Past sessions are kept.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteCustom(selectedMantra.id)} className="bg-destructive text-white">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="glass rounded-3xl p-6">
            <h3 className="font-elegant text-lg font-semibold mb-3">Target repetitions</h3>
            <div className="flex flex-wrap gap-2">
              {TARGETS.map((t) => (
                <button
                  key={t}
                  onClick={() => changeTarget(t)}
                  aria-pressed={target === t}
                  className={`rounded-full px-4 min-h-[40px] text-sm font-medium transition-colors ${
                    target === t ? 'bg-gold text-black' : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-lg font-semibold">{pct}%</p>
                <p className="text-[10px] text-muted-foreground">complete</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-lg font-semibold flex items-center justify-center gap-1">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  {Math.floor(elapsedSec / 60)}m
                </p>
                <p className="text-[10px] text-muted-foreground">elapsed</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-lg font-semibold">{rounds}</p>
                <p className="text-[10px] text-muted-foreground">mala rounds</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full gap-1.5" onClick={undo} disabled={count === 0}>
                <Undo2 className="h-4 w-4" /> Undo
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1 rounded-full gap-1.5" disabled={count === 0}>
                    <RotateCcw className="h-4 w-4" /> Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-strong rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset the counter?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The current count ({count}) will restart at zero for this target.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={reset}>Reset counter</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button className="flex-1 rounded-full gap-1.5" onClick={finishSession} disabled={saving || !sessionId}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Finish
              </Button>
            </div>
            {sessionId && (
              <button
                onClick={() => setPaused((p) => !p)}
                className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[32px]"
              >
                {paused ? '▶ Resume session timer' : '⏸ Pause session timer'}
              </button>
            )}
          </div>
        </div>

        {/* Counter column */}
        <div className="lg:col-span-3 glass rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-6 min-h-[480px] relative overflow-hidden">
          <ImageFallback src="/images/mantra-shiva.png" alt="" className="absolute inset-0 opacity-[0.14]" />
          <div className="relative flex items-center justify-center">
            <MalaRing fill={effectiveFill} size={300} />
            <ProgressRing progress={count / Math.max(1, target)} size={240} strokeWidth={6} color="var(--gold)" trackColor="transparent" animate={false}>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={count}
                  initial={{ scale: 0.7, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="font-elegant text-6xl font-semibold"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm text-muted-foreground mt-1">of {target}</span>
              <span className="text-[11px] text-gold mt-0.5">{selectedMantra?.name ?? 'Select a mantra'}</span>
            </ProgressRing>
          </div>

          {/* Tap to count */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={increment}
            className="h-24 w-24 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex flex-col items-center justify-center gap-0.5 min-h-[96px] min-w-[96px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Count one chant"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
            <span className="text-xs font-semibold">TAP</span>
          </motion.button>

          <div className="flex items-center gap-6">
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11" onClick={() => setCountSafe(count + 1)} aria-label="Add one">
              <Plus className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11" onClick={undo} disabled={count === 0} aria-label="Undo one">
              <Minus className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {user?.name ?? 'Friend'}, each repetition is saved automatically — press
            <kbd className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-[10px]">Space</kbd>
            to count hands-free.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {celebrating && (
          <CompletionOverlay
            rounds={rounds}
            count={count}
            onContinue={() => {
              celebratedRef.current = false
              setCelebrating(false)
            }}
            onFinish={() => {
              setCelebrating(false)
              void finishSession()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
