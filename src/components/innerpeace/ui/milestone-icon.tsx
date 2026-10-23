'use client'

import {
  Award,
  Flame,
  Sparkles,
  Brain,
  Flower2,
  CircleDot,
  BookHeart,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  award: Award,
  flame: Flame,
  sparkles: Sparkles,
  brain: Brain,
  flower: Flower2,
  'circle-dot': CircleDot,
  'book-heart': BookHeart,
  om: Sparkles,
}

export function MilestoneIcon({ icon, className = 'h-5 w-5' }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Award
  return <Icon className={className} aria-hidden="true" />
}
