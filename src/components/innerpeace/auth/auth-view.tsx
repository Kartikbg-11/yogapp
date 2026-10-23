'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flower2, Loader2, Sparkles } from 'lucide-react'
import { api } from '@/lib/client'
import { useAppStore } from '@/lib/store'
import type { UserDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageFallback } from '@/components/innerpeace/ui/image-fallback'
import { Particles } from '@/components/innerpeace/ui/particles'
import { toast } from '@/hooks/use-toast'

type Mode = 'signin' | 'register'

export function AuthView() {
  const signIn = useAppStore((s) => s.signIn)
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = (): string => {
    if (mode === 'register' && name.trim().length < 2) return 'Please enter your name (2+ characters).'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (mode === 'register' && password !== confirm) return 'Passwords do not match.'
    return ''
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError('')
    setLoading(true)
    try {
      const res =
        mode === 'signin'
          ? await api.post<{ token: string; user: UserDTO }>('/api/auth/login', { email, password })
          : await api.post<{ token: string; user: UserDTO }>('/api/auth/register', {
              name: name.trim(),
              email: email.trim(),
              password,
            })
      signIn(res.token, res.user)
      toast({
        title: `Welcome${mode === 'register' ? '' : ' back'}, ${res.user.name}`,
        description: 'Take a deep breath — your sanctuary awaits.',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const tryDemo = async () => {
    setEmail('demo@innerpeace.app')
    setPassword('innerpeace123')
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: UserDTO }>('/api/auth/login', {
        email: 'demo@innerpeace.app',
        password: 'innerpeace123',
      })
      signIn(res.token, res.user)
      toast({ title: 'Welcome to the demo', description: 'Explore InnerPeace with sample history.' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: imagery */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <ImageFallback
          src="/images/hero-sunrise.png"
          alt="Meditating on a mountain cliff at sunrise"
          className="h-full"
          overlay
        />
        <Particles count={24} />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="font-elegant text-3xl leading-snug max-w-md">
            &ldquo;Peace comes from within. Do not seek it without.&rdquo;
          </p>
          <p className="mt-3 text-sm text-white/80">— Buddha</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-16 w-16 rounded-3xl bg-primary/15 text-primary flex items-center justify-center mb-4">
              <Flower2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="font-elegant text-4xl font-semibold text-primary">InnerPeace</h1>
            <p className="mt-1 text-sm text-muted-foreground tracking-wide">Breathe • Meditate • Grow</p>
          </div>

          <div className="glass rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex rounded-xl bg-secondary p-1 mb-6" role="tablist" aria-label="Auth mode">
              {(['signin', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m)
                    setError('')
                  }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors min-h-[44px] ${
                    mode === m ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              {mode === 'register' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    placeholder="Kartik"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
              {mode === 'register' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="mt-2 h-12 rounded-xl text-base">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signin' ? 'Sign In' : 'Begin Your Journey'}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-widest">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={tryDemo}
              disabled={loading}
              className="w-full h-12 rounded-xl gap-2"
            >
              <Sparkles className="h-4 w-4 text-gold" />
              Explore the demo account
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Your practice is private. Only you can see your sessions, goals, and journal.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
