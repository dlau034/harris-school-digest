'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ANIMALS_BY_TYPE } from '@/lib/animals'

const STORAGE_KEY = 'harris-phonics-done'
const LAND_ANIMALS = ANIMALS_BY_TYPE.land

const CATEGORIES_URLS: string[] = [
  'https://schools.ruthmiskin.com/resources/vc-pathways/395319/hD6sV2Hlpbb0FExy',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395321/D5sfBHEKJNN5s3zz',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395295/3vwx3MskwoANFg4v',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395314/V0xluhLq1k4J2kde',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395260/DxyWaghno8NYsE51',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395300/AFIXf1JDq1PjZn2n',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395262/49JO8mrH0a1aCO3o',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395268/LmstLoGsE0IB51qF',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395275/zRaId3I2g90bzfrl',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395291/2nhTnRpSjUpFpnfx',
  'https://schools.ruthmiskin.com/resources/vc-pathways/395323/Kq07H40USMqcKOa1',
]

const RESOURCE_ANIMAL_MAP: Record<string, number> = {}
CATEGORIES_URLS.forEach((url, i) => {
  RESOURCE_ANIMAL_MAP[url] = i % LAND_ANIMALS.length
})

interface AnimalPos {
  id: string
  emoji: string
  name: string
  x: number
  y: number
  vx: number
  vy: number
  facingLeft: boolean
}

const PEN_PADDING = 8
const EMOJI_SIZE = 5

function initPos(emoji: string, name: string, idx: number): AnimalPos {
  const angle = (idx / 8) * Math.PI * 2 + Math.random() * 0.5
  const speed = 0.046
  const vx = Math.cos(angle) * speed * (0.6 + Math.random() * 0.8)
  const vy = Math.sin(angle) * speed * (0.6 + Math.random() * 0.8)
  return {
    id: `land-${idx}`,
    emoji,
    name,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    vx,
    vy,
    facingLeft: vx < 0,
  }
}

function LandPen({ animals }: { animals: AnimalPos[] }) {
  // Direct DOM refs — animation writes to DOM, never triggers React re-renders
  const domRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const stateRef = useRef<AnimalPos[]>(animals)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Only reset physics state when animal count changes
  const prevLengthRef = useRef(animals.length)
  useEffect(() => {
    if (animals.length !== prevLengthRef.current) {
      stateRef.current = animals
      prevLengthRef.current = animals.length
    }
  }, [animals])

  useEffect(() => {
    if (animals.length === 0) return

    // Reset lastTime when tab regains focus to avoid delta spike
    const onVisible = () => { lastTimeRef.current = 0 }
    document.addEventListener('visibilitychange', onVisible)

    const tick = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp
      const delta = Math.min((timestamp - lastTimeRef.current) / 16.67, 3)
      lastTimeRef.current = timestamp

      stateRef.current = stateRef.current.map(a => {
        let { x, y, vx, vy, facingLeft } = a

        if (Math.random() < 0.01) {
          vx += (Math.random() - 0.5) * 0.025
          vy += (Math.random() - 0.5) * 0.025
        }
        const spd = Math.sqrt(vx * vx + vy * vy)
        if (spd > 0.08)  { vx = (vx / spd) * 0.08; vy = (vy / spd) * 0.08 }
        if (spd < 0.025) { vx *= 1.03; vy *= 1.03 }

        x += vx * delta
        y += vy * delta

        const min = PEN_PADDING
        const max = 100 - PEN_PADDING - EMOJI_SIZE
        if (x < min) { x = min; vx = Math.abs(vx) }
        if (x > max) { x = max; vx = -Math.abs(vx) }
        if (y < min) { y = min; vy = Math.abs(vy) }
        if (y > max) { y = max; vy = -Math.abs(vy) }

        facingLeft = vx < 0

        // Write directly to DOM — zero React involvement, zero flicker
        const el = domRefs.current.get(a.id)
        if (el) {
          el.style.left = `${x}%`
          el.style.top = `${y}%`
          el.style.transform = `scaleX(${facingLeft ? -1 : 1})`
        }

        return { ...a, x, y, vx, vy, facingLeft }
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [animals.length])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">🌿</span>
        <span className="text-xs font-bold uppercase tracking-widest text-[#374151] font-mono">Land Enclosure</span>
        <span className="ml-auto text-xs text-[#9CA3AF] font-mono">
          {animals.length} animal{animals.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '4/3',
          touchAction: 'none',
          userSelect: 'none',
          pointerEvents: 'none',
          background: `
            repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(0,0,0,0.05) 15px, rgba(0,0,0,0.05) 16px),
            repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,0,0,0.05) 15px, rgba(0,0,0,0.05) 16px),
            #22c55e
          `,
          boxShadow: `
            inset 0 0 0 4px #78350f,
            inset 0 0 0 8px #d97706,
            inset 0 0 0 12px #78350f,
            inset 0 0 0 16px #fbbf24
          `,
        }}
      >
        {/* Corner posts */}
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map(pos => (
          <div
            key={pos}
            className={`absolute ${pos} w-5 h-5 bg-[#92400e] z-10`}
            style={{ boxShadow: '0 0 0 2px #78350f' }}
          />
        ))}

        {animals.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-50">
            <span className="text-5xl">🥚</span>
            <span className="text-sm text-white font-bold font-mono">Complete phonics to hatch animals!</span>
          </div>
        )}

        {/* Rendered once — positions updated via DOM refs, no re-renders */}
        {animals.map(a => (
          <div
            key={a.id}
            ref={el => {
              if (el) domRefs.current.set(a.id, el)
              else domRefs.current.delete(a.id)
            }}
            className="absolute select-none pointer-events-none"
            style={{
              left: `${a.x}%`,
              top: `${a.y}%`,
              fontSize: '1.92rem',
              lineHeight: 1,
              transform: `scaleX(${a.facingLeft ? -1 : 1})`,
              zIndex: 5,
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
              willChange: 'left, top, transform',
            }}
            title={a.name}
          >
            {a.emoji}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ZooPage() {
  const router = useRouter()
  const [collectedUrls, setCollectedUrls] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCollectedUrls(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  const buildAnimals = useCallback((): AnimalPos[] => {
    const result: AnimalPos[] = []
    collectedUrls.forEach(url => {
      const idx = RESOURCE_ANIMAL_MAP[url]
      if (idx === undefined) return
      const animal = LAND_ANIMALS[idx]
      result.push(initPos(animal.emoji, animal.name, result.length))
    })
    return result
  }, [collectedUrls])

  const animals = useMemo(() => mounted ? buildAnimals() : [], [mounted, buildAnimals])
  const total = animals.length

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        background: `
          repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(0,0,0,0.06) 11px, rgba(0,0,0,0.06) 12px),
          repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(0,0,0,0.06) 11px, rgba(0,0,0,0.06) 12px),
          repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 4px, transparent 4px, transparent 12px),
          #2d7a2d
        `,
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between sticky top-0 z-20"
        style={{
          background: 'rgba(0,0,0,0.55)',
          borderBottom: '3px solid #78350f',
          boxShadow: '0 3px 0 #d97706',
          backdropFilter: 'blur(4px)',
        }}
      >
        <button
          onClick={() => router.push('/learning')}
          className="flex items-center gap-1.5 text-[#fbbf24] hover:text-white text-sm font-bold transition-colors font-mono"
        >
          ◀ Back
        </button>
        <div className="text-center">
          <p className="text-[#fbbf24] font-bold text-base font-mono">🦁 My Zoo</p>
          <p className="text-[#d97706] text-xs font-mono">{total} animal{total !== 1 ? 's' : ''} collected</p>
        </div>
        <div className="w-16" />
      </div>

      <div className="p-4 sm:p-8 pb-8 flex justify-center">
        <div className="w-full max-w-2xl">
          <LandPen animals={animals} />
        </div>
      </div>
    </div>
  )
}
