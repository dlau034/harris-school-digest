'use client'

import { useState, useEffect } from 'react'

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

const ANIMAL_EMOJIS = [
  '🦁','🐯','🐻','🐨','🐼','🐸','🐵','🦊','🐺','🦝',
  '🐴','🦄','🦓','🦒','🐘','🦛','🦏','🐪','🦘','🦙',
  '🐇','🦔','🐿️','🦫','🦡','🦦','🦥','🐁','🐹','🐰',
  '🐢','🐍','🦎','🐊','🦖','🦕','🐙','🦑','🦐','🦞',
  '🦀','🐡','🐠','🐟','🐬','🐳','🦈','🦭','🐋','🐆',
]

export default function LearningPage() {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setDone(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  const toggle = (url: string) => {
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const activeCat = CATEGORIES.find(c => c.id === activeCategory) ?? CATEGORIES[0]
  const liveResources = activeCat.resources.filter(r => r.live)
  const doneCount = mounted ? liveResources.filter(r => done.has(r.url)).length : 0
  const progress = liveResources.length > 0 ? Math.round((doneCount / liveResources.length) * 100) : 0

  return (
    <div className="h-full overflow-y-auto bg-[#F9FAFB]">

      {/* Page header */}
      <div className="bg-[#1A1A1A] text-white px-5 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-bold">📚 Learning</h1>
          <p className="text-sm text-white/60 mt-0.5">Phonics videos for Year 1</p>
        </div>
      </div>

      {/* Main layout: sidebar + content on desktop, stacked on mobile */}
      <div className="max-w-5xl mx-auto sm:grid sm:grid-cols-[220px_1fr] sm:gap-6 sm:px-6 sm:py-6">

        {/* ── LEFT SIDEBAR — desktop only ─────────────────────────────── */}
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

        {/* ── RIGHT: resource list ─────────────────────────────────────── */}
        <main className="px-4 py-4 sm:px-0 sm:py-0 pb-24 sm:pb-6">

          {/* Mobile: horizontal pill category selector */}
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

          {/* Category heading + progress */}
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

          {/* Resource rows */}
          <div className="space-y-2">
            {activeCat.resources.map((resource, idx) => {
              const isDone = mounted && done.has(resource.url)
              const { live } = resource
              const rewardEmoji = ANIMAL_EMOJIS[idx % ANIMAL_EMOJIS.length]

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
                  {/* Status icon / reward */}
                  <div className="flex-shrink-0 w-6 flex items-center justify-center">
                    {!live ? (
                      <span className="text-sm text-[#9CA3AF]">✕</span>
                    ) : isDone ? (
                      <span className="text-2xl" title="Great work!">{rewardEmoji}</span>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#D1D5DB]" />
                    )}
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

                  {/* Actions — only for live resources */}
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
    </div>
  )
}
