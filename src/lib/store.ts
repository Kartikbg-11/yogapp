'use client'

import { create } from 'zustand'
import type { UserDTO, PreferenceDTO, ViewKey } from '@/lib/types'
import { clearAuth, getStoredUser, getToken, setAuth } from '@/lib/client'

interface AuthStore {
  token: string | null
  user: UserDTO | null
  hydrated: boolean
  view: ViewKey
  preferences: PreferenceDTO | null
  hydrate: () => void
  signIn: (token: string, user: UserDTO) => void
  signOut: () => void
  setView: (v: ViewKey) => void
  setPreferences: (p: PreferenceDTO) => void
  patchPreferences: (p: Partial<PreferenceDTO>) => void
}

export const useAppStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  view: 'dashboard',
  preferences: null,
  hydrate: () => {
    const token = getToken()
    const user = getStoredUser<UserDTO>()
    set({ token, user, hydrated: true })
  },
  signIn: (token, user) => {
    setAuth(token, user)
    set({ token, user, view: 'dashboard' })
  },
  signOut: () => {
    clearAuth()
    set({ token: null, user: null, preferences: null, view: 'dashboard' })
  },
  setView: (view) => set({ view }),
  setPreferences: (preferences) => set({ preferences }),
  patchPreferences: (patch) =>
    set((s) => ({ preferences: s.preferences ? { ...s.preferences, ...patch } : s.preferences })),
}))
