export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  { text: 'Peace comes from within. Do not seek it without.', author: 'Buddha' },
  { text: 'The journey of a thousand miles begins with a single breath.', author: 'Lao Tzu' },
  { text: 'Yoga is the journey of the self, through the self, to the self.', author: 'The Bhagavad Gita' },
  { text: 'A calm mind brings inner strength and self-confidence.', author: 'Dalai Lama' },
  { text: 'Breathe in deeply to bring your mind home to your body.', author: 'Thich Nhat Hanh' },
  { text: 'When you own your breath, nobody can steal your peace.', author: 'Unknown' },
  { text: 'The body benefits from movement, and the mind benefits from stillness.', author: 'Sakyong Mipham' },
  { text: 'In stillness, the world is restored.', author: 'Lao Tzu' },
  { text: 'Meditation is not a way of making your mind quiet. It is a way of entering into the quiet that is already there.', author: 'Deepak Chopra' },
  { text: 'You cannot always control what goes on outside. But you can always control what goes on inside.', author: 'Wayne Dyer' },
  { text: 'Om is the primordial sound of the universe, the vibration of existence itself.', author: 'Vedic Wisdom' },
  { text: 'Chanting is a way of tuning the heart to the frequency of peace.', author: 'Krishna Das' },
  { text: 'Nature does not hurry, yet everything is accomplished.', author: 'Lao Tzu' },
  { text: 'The quieter you become, the more you can hear.', author: 'Ram Dass' },
  { text: 'Every sunrise is an invitation to begin again.', author: 'Unknown' },
  { text: 'Gratitude turns what we have into enough.', author: 'Aesop' },
  { text: 'Silence is the language of the soul.', author: 'Pablo Picasso' },
  { text: 'Yoga is not about touching your toes, it is about what you learn on the way down.', author: 'Jigar Gor' },
  { text: 'Wherever you go, go with all your heart.', author: 'Confucius' },
  { text: 'A peaceful mind creates a peaceful life.', author: 'Unknown' },
]

/** Deterministic quote of the day (same all day, rotates daily). */
export function quoteOfDay(d: Date = new Date()): Quote {
  const key = d.toISOString().slice(0, 10)
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return QUOTES[hash % QUOTES.length]
}

export function randomQuote(current?: Quote): Quote {
  let q = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  let guard = 0
  while (current && q.text === current.text && guard < 10) {
    q = QUOTES[Math.floor(Math.random() * QUOTES.length)]
    guard++
  }
  return q
}
