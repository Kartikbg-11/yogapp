/* ---------- Shared types used by both API and client ---------- */

export interface UserDTO {
  id: string
  email: string
  name: string
  avatarSeed: string
  timezone: string
  createdAt: string
}

export interface PreferenceDTO {
  theme: string
  soundEnabled: boolean
  hapticsEnabled: boolean
  dailyReminder: boolean
  reminderTime: string
  motivationalQuotes: boolean
  preferredMantraId: string | null
  defaultChantTarget: number
  dailyYogaGoal: number
  dailyMeditationGoal: number
  dailyChantGoal: number
}

export interface MantraDTO {
  id: string
  name: string
  text: string
  meaning: string | null
  isCustom: boolean
}

export interface ChantSessionDTO {
  id: string
  mantraId: string | null
  mantraName: string
  count: number
  target: number
  durationSec: number
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface YogaPose {
  name: string
  sanskritName?: string
  durationSec: number
  instructions: string
  safety?: string
}

export interface YogaRoutineDTO {
  id: string
  title: string
  slug: string
  category: string
  level: string
  durationMin: number
  imageKey: string
  description: string
  benefits: string[]
  safety: string[]
  poses: YogaPose[]
}

export interface YogaSessionDTO {
  id: string
  routineId: string | null
  routineTitle: string
  durationSec: number
  completed: boolean
  createdAt: string
}

export interface MeditationSessionDTO {
  id: string
  plannedSec: number
  durationSec: number
  ambient: string | null
  completed: boolean
  createdAt: string
}

export interface GoalDTO {
  date: string
  yogaTarget: number
  meditationTarget: number
  chantTarget: number
  yogaDone: number
  meditationDone: number
  chantDone: number
}

export interface MilestoneDTO {
  key: string
  title: string
  description: string
  icon: string
  achievedAt: string
}

export interface DayActivity {
  date: string
  yogaMin: number
  meditationMin: number
  chants: number
  yogaSessions: number
  meditationSessions: number
}

export interface SummaryDTO {
  totals: {
    chants: number
    malaRounds: number
    yogaSessions: number
    yogaMinutes: number
    meditationSessions: number
    meditationMinutes: number
  }
  streak: { current: number; longest: number }
  byDay: DayActivity[]
  milestones: MilestoneDTO[]
  records: {
    longestChantSession: number
    longestMeditation: number
    mostChantsInADay: number
    totalActiveDays: number
  }
}

export interface JournalEntryDTO {
  id: string
  title: string
  content: string
  category: string
  mood: string | null
  entryDate: string
  createdAt: string
  updatedAt: string
}

export type ViewKey =
  | 'dashboard'
  | 'yoga'
  | 'meditation'
  | 'mantra'
  | 'progress'
  | 'journal'
  | 'settings'
