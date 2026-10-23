'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookHeart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { api, todayKey } from '@/lib/client'
import type { JournalEntryDTO } from '@/lib/types'
import { ImageFallback } from '@/components/innerpeace/ui/image-fallback'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

const CATEGORIES = ['gratitude', 'reflection', 'goals', 'meditation'] as const
const MOODS = ['peaceful', 'calm', 'energized', 'grateful', 'tired', 'anxious', 'hopeful'] as const

const CATEGORY_STYLE: Record<string, string> = {
  gratitude: 'bg-gold/15 text-gold border-gold/30',
  reflection: 'bg-teal-glow/15 text-teal-glow border-teal-glow/30',
  goals: 'bg-primary/15 text-primary border-primary/30',
  meditation: 'bg-secondary text-secondary-foreground border-border',
}

const EMPTY_FORM = { title: '', content: '', category: 'reflection', mood: '', entryDate: '' }

export function JournalView() {
  const [entries, setEntries] = useState<JournalEntryDTO[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntryDTO | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const searchTimer = useRef<number | null>(null)

  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [search])

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (category !== 'all') params.set('category', category)
    if (dateFilter !== 'all') {
      const to = todayKey()
      const fromDt = new Date()
      fromDt.setDate(fromDt.getDate() - (dateFilter === '7' ? 7 : 30))
      params.set('from', fromDt.toISOString().slice(0, 10))
      params.set('to', to)
    }
    try {
      const res = await api.get<{ entries: JournalEntryDTO[]; total: number }>(`/api/journal?${params}`)
      setEntries(res.entries)
      setTotal(res.total)
    } catch {
      toast({ title: 'Could not load journal', variant: 'destructive' })
      setEntries([])
    }
  }, [page, pageSize, debouncedSearch, category, dateFilter])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, entryDate: todayKey() })
    setDialogOpen(true)
  }

  const openEdit = (e: JournalEntryDTO) => {
    setEditing(e)
    setForm({ title: e.title, content: e.content, category: e.category, mood: e.mood ?? '', entryDate: e.entryDate })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Title and content are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        mood: form.mood || undefined,
        entryDate: form.entryDate || todayKey(),
      }
      if (editing) {
        await api.patch(`/api/journal/${editing.id}`, payload)
        toast({ title: 'Entry updated' })
      } else {
        await api.post('/api/journal', payload)
        toast({ title: 'Entry saved', description: 'Your reflection is safe with you.' })
      }
      setDialogOpen(false)
      load()
    } catch {
      toast({ title: 'Could not save entry', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    try {
      await api.delete(`/api/journal/${id}`)
      toast({ title: 'Entry deleted' })
      load()
    } catch {
      toast({ title: 'Could not delete entry', variant: 'destructive' })
    }
  }

  const weeklySummary = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekKey = weekAgo.toISOString().slice(0, 10)
    const recent = (entries ?? []).filter((e) => e.entryDate >= weekKey)
    const moodCount = new Map<string, number>()
    const catCount = new Map<string, number>()
    for (const e of recent) {
      if (e.mood) moodCount.set(e.mood, (moodCount.get(e.mood) ?? 0) + 1)
      catCount.set(e.category, (catCount.get(e.category) ?? 0) + 1)
    }
    const topMood = [...moodCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const topCat = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    return { count: recent.length, topMood, topCat }
  }, [entries])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const Form = (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="j-title">Title</Label>
        <Input
          id="j-title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="A quiet morning…"
          maxLength={120}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger className="rounded-xl min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Mood (optional)</Label>
          <Select value={form.mood || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, mood: v === 'none' ? '' : v }))}>
            <SelectTrigger className="rounded-xl min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No mood</SelectItem>
              {MOODS.map((m) => (
                <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="j-date">Date</Label>
        <Input
          id="j-date"
          type="date"
          value={form.entryDate}
          max={todayKey()}
          onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
          className="rounded-xl"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="j-content">Your reflection</Label>
        <Textarea
          id="j-content"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Write freely — this space is only yours…"
          className="min-h-44 nice-scroll"
        />
      </div>
      <Button onClick={save} disabled={saving} className="rounded-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {editing ? 'Save changes' : 'Save entry'}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <section className="relative rounded-3xl overflow-hidden h-40 sm:h-48">
        <ImageFallback src="/images/forest-mist.png" alt="Sunlit misty forest" className="absolute inset-0" overlay />
        <div className="relative h-full flex flex-col justify-end p-6 text-white">
          <h2 className="font-elegant text-2xl sm:text-3xl font-semibold">Journal</h2>
          <p className="text-white/85 text-sm mt-1">Reflect, feel gratitude, grow.</p>
        </div>
      </section>

      {/* Weekly summary */}
      <div className="glass rounded-3xl p-5 flex flex-wrap items-center gap-x-8 gap-y-2">
        <div>
          <p className="text-2xl font-semibold">{weeklySummary.count}</p>
          <p className="text-xs text-muted-foreground">entries this week</p>
        </div>
        {weeklySummary.topMood && (
          <div>
            <p className="text-lg font-semibold capitalize text-teal-glow">{weeklySummary.topMood}</p>
            <p className="text-xs text-muted-foreground">most frequent mood</p>
          </div>
        )}
        {weeklySummary.topCat && (
          <div>
            <p className="text-lg font-semibold capitalize text-gold">{weeklySummary.topCat}</p>
            <p className="text-xs text-muted-foreground">top category</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your entries…"
            className="pl-10 rounded-full min-h-[44px]"
            aria-label="Search journal"
          />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
          <SelectTrigger className="sm:w-44 rounded-full min-h-[44px]" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPage(1) }}>
          <SelectTrigger className="sm:w-40 rounded-full min-h-[44px]" aria-label="Filter by date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong rounded-3xl max-h-[85vh] overflow-y-auto nice-scroll">
            <DialogHeader>
              <DialogTitle className="font-elegant">{editing ? 'Edit entry' : 'New journal entry'}</DialogTitle>
            </DialogHeader>
            {Form}
          </DialogContent>
        </Dialog>
      </div>

      {/* Entries */}
      {!entries ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass rounded-3xl p-12 flex flex-col items-center gap-3 text-center">
          <BookHeart className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h3 className="font-elegant text-xl font-semibold">
            {search || category !== 'all' || dateFilter !== 'all' ? 'No entries match your filters' : 'Your journey begins on paper'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {search || category !== 'all' || dateFilter !== 'all'
              ? 'Try clearing the search or filters to see more of your writing.'
              : 'Write your first reflection — a gratitude note, a meditation insight, or an intention for tomorrow.'}
          </p>
          {(search || category !== 'all' || dateFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setSearch('')
                setCategory('all')
                setDateFilter('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entries.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="glass rounded-3xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-elegant text-lg font-semibold truncate">{e.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.entryDate + 'T00:00:00').toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)} aria-label="Edit entry">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Delete entry">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-strong rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                          <AlertDialogDescription>&ldquo;{e.title}&rdquo; will be removed permanently.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep it</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(e.id)} className="bg-destructive text-white">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={`rounded-full text-[10px] capitalize ${CATEGORY_STYLE[e.category] ?? ''}`}>
                    {e.category}
                  </Badge>
                  {e.mood && (
                    <Badge variant="outline" className="rounded-full text-[10px] capitalize">
                      {e.mood}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{e.content}</p>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                page {page} of {totalPages}
              </span>
              <Button variant="outline" size="icon" className="rounded-full" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
