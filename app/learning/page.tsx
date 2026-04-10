'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ANIMALS_BY_TYPE } from '@/lib/animals'

const ANIMALS = ANIMALS_BY_TYPE.land

interface Resource {
  date: string
  title: string
  url: string
  live: boolean
}

interface Category {
  id: string
  label: string
  dateRange: string
  resources: Resource[]
}

const CATEGORIES: Category[] = [
  {
    id: 'easter-break',
    label: 'Easter Break',
    dateRange: '30 Mar – 12 Apr',
    resources: [
      { date: '30 Mar', title: 'psc 12', url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395319/hD6sV2Hlpbb0FExy', live: true },
      { date: '31 Mar', title: 'psc 13', url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395321/D5sfBHEKJNN5s3zz', live: true },
      { date: '01 Apr', title: '—',      url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395259/qs7UGvzFO91oDFfo', live: false },
      { date: '02 Apr', title: '—',      url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395253/ySTQZ94XVYBkrQh4', live: false },
      { date: '03 Apr', title: 'psc 8',  url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395295/3vwx3MskwoANFg4v', live: true },
      { date: '04 Apr', title: 'psc 11', url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395314/V0xluhLq1k4J2kde', live: true },
      { date: '05 Apr', title: 'psc 3',  url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395260/DxyWaghno8NYsE51', live: true },
      { date: '06 Apr', title: 'psc 10', url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395300/AFIXf1JDq1PjZn2n', live: true },
      { date: '07 Apr', title: 'psc 4',  url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395262/49JO8mrH0a1aCO3o', live: true },
      { date: '08 Apr', title: 'psc 5',  url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395268/LmstLoGsE0IB51qF', live: true },
      { date: '09 Apr', title: '—',      url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395297/zCWXFwhuUix7anmv', live: false },
      { date: '10 Apr', title: 'psc 6',  url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395275/zRaId3I2g90bzfrl', live: true },
      { date: '11 Apr', title: 'psc 7',  url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395291/2nhTnRpSjUpFpnfx', live: true },
      { date: '12 Apr', title: 'psc 14', url: 'https://schools.ruthmiskin.com/resources/vc-pathways/395323/Kq07H40USMqcKOa1', live: true },
    ],
  },
]

const STORAGE_KEY = 'harris-phonics-done'

// Assign an animal to each resource by its global index across all categories
const buildResourceAnimalMap = (): Record<string, number> => {
  const map: Record<string, number> = {}
  let idx = 0
  for (const cat of CATEGORIES) {
    for (const r of cat.resources) {
      if (r.live) {
        map[r.url] = idx % ANIMALS.length
        idx++
      }
    }
  }
  return map
}

const RESOURCE_ANIMAL_MAP = buildResourceAnimalMap()

interface RevealState {
  animalIdx: number
  phase: 'shake' | 'crack' | 'reveal'
}

// Simple audio beep using Web Audio API
function playSound(type: 'crack' | 'reveal') {
  try {
    const ctx = new AudioContext()
    if (type === 'crack') {
      // Short percussive crack
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04))
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start()
    } else {
      // Cheerful rising arp
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.08)
        osc.stop(ctx.currentTime + i * 0.08 + 0.2)
      })
    }
  } catch {}
}

export default function LearningPage() {
  const router = useRouter()
  const [done, setDone] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [mounted, setMounted] = useState(false)
  const [reveal, setReveal] = useState<RevealState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setDone(new Set(JSON.parse(stored)))
    } catch {}
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const toggle = (url: string) => {
    const wasAlreadyDone = done.has(url)
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch {}
      return next
    })

    // Only trigger reveal when marking as done (not un-doing)
    if (!wasAlreadyDone) {
      const animalIdx = RESOURCE_ANIMAL_MAP[url] ?? 0
      setReveal({ animalIdx, phase: 'shake' })
      playSound('crack')

      timerRef.current = setTimeout(() => {
        setReveal(r => r ? { ...r, phase: 'crack' } : null)
        timerRef.current = setTimeout(() => {
          setReveal(r => r ? { ...r, phase: 'reveal' } : null)
          playSound('reveal')
        }, 400)
      }, 300)
    }
  }

  const closeReveal = () => {
    setReveal(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const activeCat = CATEGORIES.find(c => c.id === activeCategory) ?? CATEGORIES[0]
  const liveResources = activeCat.resources.filter(r => r.live)
  const doneCount = mounted ? liveResources.filter(r => done.has(r.url)).length : 0
  const progress = liveResources.length > 0 ? Math.round((doneCount / liveResources.length) * 100) : 0

  const totalDone = mounted ? CATEGORIES.flatMap(c => c.resources.filter(r => r.live)).filter(r => done.has(r.url)).length : 0

  const revealAnimal = reveal !== null ? ANIMALS[reveal.animalIdx] : null

  return (
    <div className="h-full overflow-y-auto bg-[#F9FAFB]">

      {/* Egg crack overlay */}
      {reveal && revealAnimal && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
          onClick={closeReveal}
        >
          <button
            onClick={closeReveal}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-base font-bold px-5 py-3 border-2 border-white/30 hover:border-white/60 rounded-xl transition-colors"
          >
            ✕ Close
          </button>

          <div
            className="flex flex-col items-center gap-6 px-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Egg / animal display */}
            <div
              className={`text-8xl select-none transition-all duration-300 ${
                reveal.phase === 'shake'
                  ? 'animate-[eggShake_0.3s_ease-in-out]'
                  : reveal.phase === 'crack'
                  ? 'opacity-60 scale-90'
                  : 'animate-[animalBounce_0.5s_ease-out]'
              }`}
              style={{
                filter: reveal.phase === 'crack' ? 'blur(1px)' : 'none',
              }}
            >
              {reveal.phase === 'reveal' ? revealAnimal.emoji : '🥚'}
            </div>

            {/* Fun fact card — only shown after reveal */}
            {reveal.phase === 'reveal' && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-5 max-w-xs text-center animate-[fadeUp_0.4s_ease-out]">
                <p className="text-white font-bold text-lg mb-1">{revealAnimal.name}!</p>
                <p className="text-white/80 text-sm leading-relaxed">{revealAnimal.funFact}</p>
              </div>
            )}

            {reveal.phase === 'reveal' && (
              <button
                onClick={() => { closeReveal(); router.push('/zoo') }}
                className="mt-1 text-sm font-bold text-[#1A1A1A] bg-[#fbbf24] hover:bg-yellow-300 px-6 py-3 rounded-xl transition-colors animate-[fadeUp_0.5s_ease-out]"
              >
                View in Zoo →
              </button>
            )}

            {reveal.phase !== 'reveal' && (
              <p className="text-white/40 text-sm">Hatching...</p>
            )}
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="bg-[#1A1A1A] text-white px-5 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">📚 Learning</h1>
            <p className="text-sm text-white/60 mt-0.5">Phonics videos for Year 1</p>
          </div>
          <button
            onClick={() => router.push('/zoo')}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <span>🦁</span>
            <span>View Zoo</span>
            {totalDone > 0 && (
              <span className="bg-[#D00A2C] text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                {totalDone}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-5xl mx-auto sm:grid sm:grid-cols-[220px_1fr] sm:gap-6 sm:px-6 sm:py-6">

        {/* Sidebar */}
        <aside className="hidden sm:block">
          <div className="sticky top-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-3 px-1">
              Categories
            </p>
            <div className="space-y-1">
              {CATEGORIES.map(cat => {
                const live = cat.resources.filter(r => r.live)
                const catDone = mounted ? live.filter(r => done.has(r.url)).length : 0
                const isActive = cat.id === activeCategory
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-[#D00A2C] text-white'
                        : 'text-[#374151] hover:bg-white border border-transparent hover:border-[#E5E7EB]'
                    }`}
                  >
                    <p className="text-sm font-semibold">{cat.label}</p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                      {catDone} / {live.length} completed
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Resource list */}
        <main className="px-4 py-4 sm:px-0 sm:py-0 pb-24 sm:pb-6">

          {/* Mobile category pills */}
          <div className="sm:hidden mb-4 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {CATEGORIES.map(cat => {
              const live = cat.resources.filter(r => r.live)
              const catDone = mounted ? live.filter(r => done.has(r.url)).length : 0
              const isActive = cat.id === activeCategory
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#D00A2C] text-white'
                      : 'bg-white text-[#374151] border border-[#E5E7EB]'
                  }`}
                >
                  {cat.label} · {catDone}/{live.length}
                </button>
              )
            })}
          </div>

          {/* Heading + progress */}
          <div className="mb-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-[#111827]">{activeCat.label}</h2>
              <span className="text-xs text-[#9CA3AF]">{activeCat.dateRange}</span>
            </div>
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#6B7280]">
                  {doneCount} of {liveResources.length} completed
                </span>
                <span className="text-xs font-bold text-[#D00A2C]">{progress}%</span>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D00A2C] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {activeCat.resources.map((resource) => {
              const isDone = mounted && done.has(resource.url)
              const { live } = resource
              const animalIdx = RESOURCE_ANIMAL_MAP[resource.url]
              const animal = animalIdx !== undefined ? ANIMALS[animalIdx] : null

              return (
                <div
                  key={resource.url}
                  className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 transition-all ${
                    !live
                      ? 'border-[#E5E7EB] opacity-40'
                      : isDone
                        ? 'border-green-200 bg-green-50/60'
                        : 'border-[#E5E7EB] hover:border-[#D00A2C]/20 hover:shadow-sm'
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0 w-8 flex items-center justify-center">
                    {!live ? (
                      <span className="text-sm text-[#9CA3AF]">✕</span>
                    ) : isDone && animal ? (
                      <span className="text-2xl" title={animal.name}>{animal.emoji}</span>
                    ) : live ? (
                      <span className="text-2xl">🥚</span>
                    ) : null}
                  </div>

                  {/* Date + title */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isDone && live ? 'text-green-600' : 'text-[#9CA3AF]'
                    }`}>
                      {resource.date}
                    </p>
                    <p className={`text-sm font-semibold mt-0.5 ${live ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                      {live ? resource.title : 'Unavailable'}
                    </p>
                    {live && (
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Ruth Miskin · Phonics</p>
                    )}
                  </div>

                  {/* Actions */}
                  {live && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#D00A2C] border border-[#D00A2C]/40 rounded-lg px-2.5 py-1.5 hover:bg-[#D00A2C] hover:text-white transition-colors"
                      >
                        Open →
                      </a>
                      <button
                        onClick={() => toggle(resource.url)}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-green-500 border-green-500'
                            : 'border-[#D1D5DB] hover:border-[#D00A2C]'
                        }`}
                        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
                      >
                        {isDone && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes eggShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-8deg) scale(1.05); }
          40% { transform: rotate(8deg) scale(1.05); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(5deg); }
        }
        @keyframes animalBounce {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
