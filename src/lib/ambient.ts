'use client'

/* Synthesized ambient sound engine using WebAudio — no external audio assets required.
   All sounds are procedurally generated so they always work offline. */

export type AmbientKind = 'rain' | 'ocean' | 'forest' | 'wind' | 'bells'

interface AmbientNode {
  ctx: AudioContext
  master: GainNode
  stop: () => void
}

let current: AmbientNode | null = null
let masterVolume = 0.5

export function setAmbientVolume(v: number) {
  masterVolume = Math.min(1, Math.max(0, v))
  if (current) current.master.gain.setTargetAtTime(masterVolume * 0.6, current.ctx.currentTime, 0.2)
}

function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/** A single soft meditation bell strike. */
export function playBell(volume = 0.5) {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  const ctx = new Ctx()
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = volume
  master.connect(ctx.destination)
  // bell partials: fundamental + harmonics with exponential decay
  const partials = [523.25, 1046.5, 1567.98, 2093]
  const gains = [1, 0.4, 0.2, 0.1]
  partials.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.35 * gains[i], now + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5 + i * 0.3)
    osc.connect(g)
    g.connect(master)
    osc.start(now)
    osc.stop(now + 3.2)
  })
  window.setTimeout(() => ctx.close().catch(() => {}), 4000)
}

/** Soft "tap" tick for the counter. */
export function playTick(volume = 0.25) {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  const ctx = new Ctx()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.exponentialRampToValueAtTime(660, now + 0.08)
  g.gain.setValueAtTime(volume, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.15)
  window.setTimeout(() => ctx.close().catch(() => {}), 500)
}

/** Haptic feedback where supported. */
export function haptic(pattern: number | number[] = 10) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}

export function stopAmbient() {
  if (current) {
    try {
      current.stop()
    } catch {
      /* ignore */
    }
    current = null
  }
}

export function playAmbient(kind: AmbientKind) {
  stopAmbient()
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  const ctx = new Ctx()
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  master.gain.setTargetAtTime(masterVolume * 0.6, ctx.currentTime, 0.5)

  const nodes: Array<AudioScheduledSourceNode> = []
  const timers: number[] = []

  const noise = (filterType: BiquadFilterType, freq: number, gainVal: number) => {
    const src = ctx.createBufferSource()
    src.buffer = createNoiseBuffer(ctx)
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = filterType
    filter.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = gainVal
    src.connect(filter)
    filter.connect(g)
    g.connect(master)
    src.start()
    nodes.push(src)
    return { filter, g, src }
  }

  switch (kind) {
    case 'rain': {
      const { filter } = noise('highpass', 900, 0.5)
      const low = noise('bandpass', 2400, 0.25)
      // slow intensity wobble like shifting rainfall
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.13
      lfoGain.gain.value = 500
      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)
      lfo.start()
      nodes.push(lfo)
      void low
      break
    }
    case 'ocean': {
      const { g } = noise('lowpass', 500, 0.7)
      // slow swell
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.09
      lfoGain.gain.value = 0.35
      lfo.connect(lfoGain)
      lfoGain.connect(g.gain)
      lfo.start()
      nodes.push(lfo)
      const hiss = noise('bandpass', 1800, 0.08)
      void hiss
      break
    }
    case 'forest': {
      noise('lowpass', 400, 0.25) // breeze bed
      // occasional bird chirps
      const chirp = () => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        const t = ctx.currentTime
        const base = 2200 + Math.random() * 1500
        osc.frequency.setValueAtTime(base, t)
        osc.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.08)
        osc.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.16)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.03)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
        osc.connect(g)
        g.connect(master)
        osc.start(t)
        osc.stop(t + 0.25)
        timers.push(window.setTimeout(chirp, 2500 + Math.random() * 6000))
      }
      timers.push(window.setTimeout(chirp, 1200))
      break
    }
    case 'wind': {
      const { filter } = noise('lowpass', 320, 0.6)
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.05
      lfoGain.gain.value = 180
      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)
      lfo.start()
      nodes.push(lfo)
      break
    }
    case 'bells': {
      // sparse soft bell strikes over a gentle pad
      const drone = ctx.createOscillator()
      const droneG = ctx.createGain()
      drone.type = 'sine'
      drone.frequency.value = 136.1 // "OM frequency"
      droneG.gain.value = 0.05
      drone.connect(droneG)
      droneG.connect(master)
      drone.start()
      nodes.push(drone)
      const strike = () => {
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 523.25
        g.gain.setValueAtTime(0.0001, now)
        g.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, now + 3)
        osc.connect(g)
        g.connect(master)
        osc.start(now)
        osc.stop(now + 3.5)
        timers.push(window.setTimeout(strike, 8000 + Math.random() * 7000))
      }
      timers.push(window.setTimeout(strike, 2500))
      break
    }
  }

  current = {
    ctx,
    master,
    stop: () => {
      timers.forEach((t) => window.clearTimeout(t))
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
      window.setTimeout(() => {
        nodes.forEach((n) => {
          try {
            n.stop()
          } catch {
            /* already stopped */
          }
        })
        ctx.close().catch(() => {})
      }, 700)
    },
  }
}
