'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Brain,
  Download,
  Flame,
  Flower2,
  Lock,
  Printer,
  Sparkles,
  Trophy,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, downloadCsv, formatDuration, todayKey } from '@/lib/client'
import { useAppStore } from '@/lib/store'
import type { ChantSessionDTO, MeditationSessionDTO, MilestoneDTO, SummaryDTO, YogaSessionDTO } from '@/lib/types'
import { MilestoneIcon } from '@/components/innerpeace/ui/milestone-icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

const KNOWN_MILESTONES = [
  { key: 'first_session', title: 'First Steps', description: 'Completed your first wellness session' },
  { key: 'chants_108', title: 'Sacred 108', description: 'Chanted 108 total repetitions' },
  { key: 'mala_10', title: 'Mala Master', description: 'Completed 10 full mala rounds' },
  { key: 'streak_7', title: 'Unbroken Week', description: 'Maintained a 7-day practice streak' },
  { key: 'meditation_60', title: 'Still Mind', description: 'Meditated for 60 total minutes' },
  { key: 'yoga_10', title: 'Flexible Spirit', description: 'Completed 10 yoga sessions' },
  { key: 'chants_1080', title: 'Devoted Chanter', description: 'Chanted 1,080 total repetitions' },
  { key: 'streak_30', title: 'Monthly Devotee', description: 'Maintained a 30-day practice streak' },
  { key: 'meditation_300', title: 'Deep Stillness', description: 'Meditated for 300 total minutes' },
]

type RangeKey = '7' | '30' | '90' | 'custom'

interface HistoryRow {
  type: 'yoga' | 'meditation' | 'chant'
  title: string
  detail: string
  date: string
}

export function ProgressView() {
  const setView = useAppStore((s) => s.setView)
  const [range, setRange] = useState<RangeKey>('30')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [summary, setSummary] = useState<SummaryDTO | null>(null)
  const [history, setHistory] = useState<HistoryRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (r: RangeKey, from?: string, to?: string) => {
    setLoading(true)
    try {
      let days = 30
      if (r === '7') days = 7
      else if (r === '30') days = 30
      else if (r === '90') days = 90
      else if (from && to) {
        const diff = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1
        days = Math.max(1, Math.min(365, diff))
      }
      const [sRes, yRes, mRes, cRes] = await Promise.all([
        api.get<{ summary: SummaryDTO }>(`/api/analytics/summary?days=${days}`),
        api.get<{ sessions: YogaSessionDTO[] }>('/api/yoga/sessions?limit=15'),
        api.get<{ sessions: MeditationSessionDTO[] }>('/api/meditation/sessions?limit=15'),
        api.get<{ sessions: ChantSessionDTO[] }>('/api/chant-sessions?limit=15'),
      ])
      setSummary(sRes.summary)
      const merged: HistoryRow[] = [
        ...yRes.sessions.map((s) => ({ type: 'yoga' as const, title: s.routineTitle, detail: `${Math.round(s.durationSec / 60)} min`, date: s.createdAt })),
        ...mRes.sessions.map((s) => ({ type: 'meditation' as const, title: 'Meditation', detail: `${Math.round(s.durationSec / 60)} min${s.ambient ? ` • ${s.ambient}` : ''}`, date: s.createdAt })),
        ...cRes.sessions.map((s) => ({ type: 'chant' as const, title: s.mantraName, detail: `${s.count} chants`, date: s.createdAt })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setHistory(merged)
    } catch {
      toast({ title: 'Could not load analytics', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(range)
  }, [range, load])

  const applyCustom = () => {
    if (!customFrom || !customTo) {
      toast({ title: 'Pick both dates first' })
      return
    }
    if (customFrom > customTo) {
      toast({ title: 'Start date must be before end date', variant: 'destructive' })
      return
    }
    load('custom', customFrom, customTo)
  }

  const chartData = useMemo(
    () =>
      (summary?.byDay ?? []).map((d) => ({
        ...d,
        label: d.date.slice(5),
      })),
    [summary]
  )

  const heatmap = useMemo(() => {
    const byDay = summary?.byDay ?? []
    // last 12 weeks aligned to weeks (columns), rows = weekdays
    const cells = byDay.slice(-84)
    const intensity = (d: (typeof cells)[number]) => {
      const score = (d.yogaMin + d.meditationMin) / 20 + d.chants / 108 + d.yogaSessions + d.meditationSessions
      if (score === 0) return 0
      if (score < 0.5) return 1
      if (score < 1.2) return 2
      return 3
    }
    const colors = [
      'color-mix(in oklab, var(--primary) 8%, transparent)',
      'color-mix(in oklab, var(--primary) 30%, transparent)',
      'color-mix(in oklab, var(--primary) 60%, transparent)',
      'var(--gold)',
    ]
    const cols: Array<Array<{ date: string; level: number } | null>> = []
    let week: Array<{ date: string; level: number } | null> = []
    const startDow = cells.length ? new Date(cells[0].date + 'T00:00:00Z').getUTCDay() : 0
    for (let i = 0; i < startDow; i++) week.push(null)
    for (const d of cells) {
      week.push({ date: d.date, level: intensity(d) })
      if (week.length === 7) {
        cols.push(week)
        week = []
      }
    }
    if (week.length) cols.push(week)
    return { cols, colors }
  }, [summary])

  const achievedKeys = new Set((summary?.milestones ?? []).map((m) => m.key))

  const isEmpty =
    summary &&
    summary.totals.chants === 0 &&
    summary.totals.yogaSessions === 0 &&
    summary.totals.meditationSessions === 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-elegant text-2xl font-semibold">Progress & Stats</h2>
          <p className="text-sm text-muted-foreground">Your journey, measured with honesty.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2">
                <Download className="h-4 w-4" /> Download CSV
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-strong">
              {['yoga', 'meditation', 'chant', 'journal'].map((t) => (
                <DropdownMenuItem
                  key={t}
                  onClick={() =>
                    downloadCsv(t)
                      .then(() => toast({ title: `${t} report downloaded` }))
                      .catch(() => toast({ title: 'Report failed', variant: 'destructive' }))
                  }
                  className="capitalize"
                >
                  {t} report
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="rounded-full gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap items-center gap-2">
        {(['7', '30', '90'] as RangeKey[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={`rounded-full px-4 min-h-[40px] text-sm font-medium transition-colors ${
              range === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {r === '7' ? '7 Days' : r === '30' ? '30 Days' : '3 Months'}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-10 w-38 rounded-full text-xs"
            aria-label="Custom range start"
          />
          <span className="text-muted-foreground text-sm">→</span>
          <Input
            type="date"
            value={customTo}
            max={todayKey()}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-10 w-38 rounded-full text-xs"
            aria-label="Custom range end"
          />
          <Button size="sm" variant={range === 'custom' ? 'default' : 'outline'} className="rounded-full" onClick={applyCustom}>
            Apply
          </Button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="glass rounded-3xl p-12 flex flex-col items-center gap-4 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h3 className="font-elegant text-xl font-semibold">Your journey starts here</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Complete your first yoga session, meditation, or mala — your charts, streaks, and milestones will bloom here.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <Button className="rounded-full" onClick={() => setView('yoga')}>Start Yoga</Button>
            <Button variant="outline" className="rounded-full" onClick={() => setView('meditation')}>Meditate</Button>
            <Button variant="outline" className="rounded-full" onClick={() => setView('mantra')}>Chant</Button>
          </div>
        </div>
      ) : summary ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Flower2} label="Yoga Sessions" value={String(summary.totals.yogaSessions)} sub={`${summary.totals.yogaMinutes} min total`} color="text-primary" />
            <StatCard icon={Brain} label="Meditation" value={String(summary.totals.meditationSessions)} sub={`${summary.totals.meditationMinutes} min total`} color="text-teal-glow" />
            <StatCard icon={Sparkles} label="Mantra Counts" value={summary.totals.chants.toLocaleString()} sub={`${summary.totals.malaRounds} mala rounds`} color="text-gold" />
            <StatCard icon={Flame} label="Current Streak" value={`${summary.streak.current}d`} sub={`longest ${summary.streak.longest} days`} color="text-gold" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="glass rounded-3xl p-6">
              <h3 className="font-elegant text-lg font-semibold mb-4">Practice Minutes — daily</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gYoga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--border) 60%, transparent)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--popover-foreground)',
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="yogaMin" name="Yoga min" stroke="var(--chart-1)" fill="url(#gYoga)" strokeWidth={2} />
                  <Area type="monotone" dataKey="meditationMin" name="Meditation min" stroke="var(--chart-3)" fill="url(#gMed)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="font-elegant text-lg font-semibold mb-4">Mantra Counts — daily</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--border) 60%, transparent)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    cursor={{ fill: 'color-mix(in oklab, var(--primary) 8%, transparent)' }}
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--popover-foreground)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="chants" name="Chants" fill="var(--gold)" radius={[6, 6, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heatmap + records */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 glass rounded-3xl p-6">
              <h3 className="font-elegant text-lg font-semibold mb-4">Activity Heatmap — last 12 weeks</h3>
              <div className="overflow-x-auto nice-scroll pb-1">
                <div className="flex gap-[3px] min-w-max">
                  {heatmap.cols.map((week, ci) => (
                    <div key={ci} className="flex flex-col gap-[3px]">
                      {week.map((cell, ri) =>
                        cell ? (
                          <div
                            key={ri}
                            title={`${cell.date}: ${describeDay(chartData, cell.date)}`}
                            className="h-[14px] w-[14px] rounded-[3px]"
                            style={{ background: heatmap.colors[cell.level] }}
                          />
                        ) : (
                          <div key={ri} className="h-[14px] w-[14px] rounded-[3px] bg-transparent" />
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>less</span>
                {heatmap.colors.map((c, i) => (
                  <span key={i} className="h-[12px] w-[12px] rounded-[3px]" style={{ background: c }} />
                ))}
                <span>more</span>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="font-elegant text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gold" aria-hidden="true" /> Personal Records
              </h3>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex justify-between"><span className="text-muted-foreground">Biggest chant session</span><span className="font-semibold">{summary.records.longestChantSession}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Longest meditation</span><span className="font-semibold">{formatDuration(summary.records.longestMeditation)}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Most chants in a day</span><span className="font-semibold">{summary.records.mostChantsInADay}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Active days</span><span className="font-semibold">{summary.records.totalActiveDays}</span></li>
              </ul>
            </div>
          </div>

          {/* Milestones + history */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="glass rounded-3xl p-6">
              <h3 className="font-elegant text-lg font-semibold mb-4">Milestones & Badges</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto nice-scroll pr-1">
                {KNOWN_MILESTONES.map((m) => {
                  const achieved = achievedKeys.has(m.key)
                  const record = (summary.milestones ?? []).find((x) => x.key === m.key)
                  return (
                    <motion.div
                      key={m.key}
                      whileHover={{ scale: 1.03 }}
                      className={`rounded-2xl p-3 text-center flex flex-col items-center gap-1.5 border ${
                        achieved ? 'border-gold/40 bg-gold/10' : 'border-border bg-secondary/40 opacity-60'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${achieved ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'}`}>
                        {achieved ? <MilestoneIcon icon={record?.icon ?? 'award'} className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <p className="text-xs font-semibold leading-tight">{m.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {achieved && record
                          ? `earned ${new Date(record.achievedAt).toLocaleDateString()}`
                          : m.description}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="font-elegant text-lg font-semibold mb-4">Session History</h3>
              {!history || history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No sessions in the recent window.</p>
              ) : (
                <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto nice-scroll pr-1">
                  {history.map((h, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          h.type === 'yoga' ? 'bg-primary/15 text-primary' : h.type === 'meditation' ? 'bg-teal-glow/15 text-teal-glow' : 'bg-gold/15 text-gold'
                        }`}
                      >
                        {h.type === 'yoga' ? <Flower2 className="h-4 w-4" /> : h.type === 'meditation' ? <Brain className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{h.title}</p>
                        <p className="text-xs text-muted-foreground">{h.detail}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{new Date(h.date).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function describeDay(chartData: Array<{ date: string; yogaMin: number; meditationMin: number; chants: number }>, date: string): string {
  const d = chartData.find((x) => x.date === date)
  if (!d) return date
  return `${date}: yoga ${d.yogaMin}m, meditation ${d.meditationMin}m, ${d.chants} chants`
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Flower2
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5">
      <div className={`h-10 w-10 rounded-xl bg-secondary/70 flex items-center justify-center mb-3 ${color}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </motion.div>
  )
}
