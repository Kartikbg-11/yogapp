'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Flower2,
  Loader2,
  Moon,
  Save,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { api, downloadCsv, todayKey } from '@/lib/client'
import { useAppStore } from '@/lib/store'
import type { MantraDTO, PreferenceDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { toast } from '@/hooks/use-toast'

const TARGET_OPTIONS = [27, 54, 108, 216, 1008]

export function SettingsView() {
  const user = useAppStore((s) => s.user)
  const preferences = useAppStore((s) => s.preferences)
  const setPreferences = useAppStore((s) => s.setPreferences)
  const signOut = useAppStore((s) => s.signOut)
  const { theme, setTheme } = useTheme()
  const [mantras, setMantras] = useState<MantraDTO[]>([])
  const [prefs, setPrefs] = useState<PreferenceDTO | null>(preferences)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [deleteChecked, setDeleteChecked] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (preferences) {
      setPrefs(preferences)
      return
    }
    api
      .get<{ preferences: PreferenceDTO }>('/api/preferences')
      .then((r) => {
        setPrefs(r.preferences)
        setPreferences(r.preferences)
      })
      .catch(() => toast({ title: 'Could not load preferences', variant: 'destructive' }))
  }, [preferences, setPreferences])

  useEffect(() => {
    api
      .get<{ mantras: MantraDTO[] }>('/api/mantras')
      .then((r) => setMantras(r.mantras))
      .catch(() => {})
  }, [])

  const patch = async (key: string, data: Partial<PreferenceDTO>) => {
    if (!prefs) return
    const optimistic = { ...prefs, ...data }
    setPrefs(optimistic)
    setPreferences(optimistic)
    setSavingKey(key)
    try {
      const res = await api.patch<{ preferences: PreferenceDTO }>('/api/preferences', data)
      setPrefs(res.preferences)
      setPreferences(res.preferences)
      toast({ title: 'Preferences saved' })
    } catch {
      toast({ title: 'Could not save preference', variant: 'destructive' })
    } finally {
      setSavingKey(null)
    }
  }

  const exportAll = async () => {
    toast({ title: 'Preparing exports…', description: 'Four CSV files will download.' })
    for (const t of ['yoga', 'meditation', 'chant', 'journal']) {
      try {
        await downloadCsv(t)
      } catch {
        toast({ title: `Failed to export ${t}`, variant: 'destructive' })
      }
    }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete('/api/auth/me')
      toast({ title: 'Account deleted', description: 'Take care on your journey. 🙏' })
      signOut()
    } catch {
      toast({ title: 'Could not delete account', description: 'Please try again later.', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const Row = ({
    label,
    description,
    children,
    loadingKey,
  }: {
    label: string
    description?: string
    children: React.ReactNode
    loadingKey?: string
  }) => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {loadingKey && savingKey === loadingKey && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {children}
      </div>
    </div>
  )

  if (!prefs) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="font-elegant text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Tune your sanctuary to your rhythm.</p>
      </div>

      {/* Profile */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center text-2xl font-elegant font-semibold shrink-0">
          {(user?.name ?? 'Y').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="font-elegant text-xl font-semibold truncate">{user?.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Member since {user ? new Date(user.createdAt).toLocaleDateString() : '—'} • {prefs.theme === 'dark' ? 'Midnight' : 'Cream'} theme
          </p>
        </div>
        <Flower2 className="h-8 w-8 text-gold ml-auto shrink-0" aria-hidden="true" />
      </motion.section>

      {/* Appearance */}
      <section className="glass rounded-3xl p-6">
        <h3 className="font-elegant text-lg font-semibold mb-4">Appearance</h3>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              aria-pressed={theme === t}
              className={`rounded-2xl border p-4 flex flex-col items-center gap-2 transition-colors min-h-[88px] ${
                theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent text-muted-foreground'
              }`}
            >
              {t === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="text-sm font-medium capitalize">{t}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Practice preferences */}
      <section className="glass rounded-3xl p-6">
        <h3 className="font-elegant text-lg font-semibold mb-2">Practice Preferences</h3>
        <div className="divide-y divide-border">
          <Row label="Preferred mantra" description="Pre-selected on the chanting screen">
            <Select value={prefs.preferredMantraId ?? 'none'} onValueChange={(v) => patch('preferredMantraId', { preferredMantraId: v === 'none' ? null : v })}>
              <SelectTrigger className="w-52 rounded-xl min-h-[44px]" aria-label="Preferred mantra"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No preference</SelectItem>
                {mantras.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Default chanting target" description="Starting goal for each mala session">
            <Select value={String(prefs.defaultChantTarget)} onValueChange={(v) => patch('defaultChantTarget', { defaultChantTarget: Number(v) })}>
              <SelectTrigger className="w-32 rounded-xl min-h-[44px]" aria-label="Default chant target"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TARGET_OPTIONS.map((t) => (
                  <SelectItem key={t} value={String(t)}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Daily yoga goal" description="Sessions per day">
            <Select value={String(prefs.dailyYogaGoal)} onValueChange={(v) => patch('dailyYogaGoal', { dailyYogaGoal: Number(v) })}>
              <SelectTrigger className="w-24 rounded-xl min-h-[44px]" aria-label="Daily yoga goal"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Daily meditation goal" description="Minutes per day">
            <Select value={String(prefs.dailyMeditationGoal)} onValueChange={(v) => patch('dailyMeditationGoal', { dailyMeditationGoal: Number(v) })}>
              <SelectTrigger className="w-24 rounded-xl min-h-[44px]" aria-label="Daily meditation goal"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20, 30, 45, 60].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}m</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Daily chant goal" description="Repetitions per day">
            <Select value={String(prefs.dailyChantGoal)} onValueChange={(v) => patch('dailyChantGoal', { dailyChantGoal: Number(v) })}>
              <SelectTrigger className="w-24 rounded-xl min-h-[44px]" aria-label="Daily chant goal"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[27, 54, 108, 216, 432].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </div>
      </section>

      {/* Sound & reminders */}
      <section className="glass rounded-3xl p-6">
        <h3 className="font-elegant text-lg font-semibold mb-2 flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" /> Sound & Reminders
        </h3>
        <div className="divide-y divide-border">
          <Row label="Sound effects" description="Bells and counter ticks" loadingKey="soundEnabled">
            <Switch checked={prefs.soundEnabled} onCheckedChange={(v) => patch('soundEnabled', { soundEnabled: v })} aria-label="Sound effects" />
          </Row>
          <Row label="Haptic feedback" description="Vibration on supported devices" loadingKey="hapticsEnabled">
            <Switch checked={prefs.hapticsEnabled} onCheckedChange={(v) => patch('hapticsEnabled', { hapticsEnabled: v })} aria-label="Haptic feedback" />
          </Row>
          <Row label="Motivational quotes" description="Daily wisdom on your dashboard" loadingKey="motivationalQuotes">
            <Switch checked={prefs.motivationalQuotes} onCheckedChange={(v) => patch('motivationalQuotes', { motivationalQuotes: v })} aria-label="Motivational quotes" />
          </Row>
          <Row label="Daily reminder" description="A gentle nudge to practice" loadingKey="dailyReminder">
            <Switch checked={prefs.dailyReminder} onCheckedChange={(v) => patch('dailyReminder', { dailyReminder: v })} aria-label="Daily reminder" />
          </Row>
          {prefs.dailyReminder && (
            <Row label="Reminder time" description="Timezone-aware, shown in your local time" loadingKey="reminderTime">
              <Input
                type="time"
                value={prefs.reminderTime}
                onChange={(e) => {
                  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(e.target.value)) patch('reminderTime', { reminderTime: e.target.value })
                }}
                className="w-32 rounded-xl min-h-[44px]"
                aria-label="Reminder time"
              />
            </Row>
          )}
        </div>
      </section>

      {/* Account */}
      <section className="glass rounded-3xl p-6">
        <h3 className="font-elegant text-lg font-semibold mb-2">Account</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone} • dates in your session history follow your device clock.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-full gap-2" onClick={exportAll}>
            <Download className="h-4 w-4" /> Export my data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2 text-destructive border-destructive/40">
                <Trash2 className="h-4 w-4" /> Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-strong rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account forever?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every session, journal entry, milestone, and preference will be permanently erased. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label className="flex items-center gap-2 text-sm rounded-xl bg-destructive/10 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteChecked}
                  onChange={(e) => setDeleteChecked(e.target.checked)}
                  className="accent-destructive h-4 w-4"
                />
                I understand all my data will be lost
              </label>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteChecked(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    if (deleteChecked) void deleteAccount()
                  }}
                  className={`bg-destructive text-white ${!deleteChecked ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 hidden" />}
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      {/* About */}
      <section className="glass rounded-3xl p-6 text-center">
        <Flower2 className="h-8 w-8 text-primary mx-auto mb-2" aria-hidden="true" />
        <h3 className="font-elegant text-lg font-semibold">InnerPeace v1.0</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          A sanctuary for yoga, meditation, and mantra — built with Next.js, Prisma, and care for your inner journey.
          All ambient sounds are synthesized live in your browser.
        </p>
        <p className="text-xs text-muted-foreground mt-3">Today is {todayKey()} — make it gentle.</p>
      </section>
    </div>
  )
}
