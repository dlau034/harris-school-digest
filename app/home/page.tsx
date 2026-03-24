'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, isToday, isTomorrow, isWeekend, addDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { EmailSummary, CalendarEvent, WeatherData } from '@/lib/types'
import CalendarEventItem from '@/components/CalendarEventItem'

// ── School status logic ──────────────────────────────────────────────────────

const CLUB_DAYS = [1, 3, 4, 5] // Mon, Wed, Thu, Fri (0=Sun, 6=Sat)

function getSchoolStatus(now: Date, events: Pick<CalendarEvent, 'id' | 'event_date' | 'title' | 'event_type' | 'description'>[]): { emoji: string; message: string; colour: string } {
  const todayStr = format(now, 'yyyy-MM-dd')
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const timeVal = hours * 60 + minutes
  const day = now.getDay()

  // Check for term break — look for Closure events that span today
  const termBreak = events.find(e => {
    if (e.event_type !== 'Closure') return false
    const t = e.title.toLowerCase()
    return t.includes('term') || t.includes('break') || t.includes('holiday') || t.includes('half')
  })
  if (termBreak) {
    // Find next non-closure event after today
    const nextSchoolEvent = events.find(e => e.event_date > todayStr && e.event_type !== 'Closure')
    const backDate = nextSchoolEvent ? format(parseISO(nextSchoolEvent.event_date), 'd MMM') : 'soon'
    return { emoji: '🏖️', message: `On term break — back on ${backDate}`, colour: 'bg-red-900/40' }
  }

  // Check for half day today
  const halfDay = events.find(e => {
    const t = (e.title + ' ' + (e.description || '')).toLowerCase()
    return e.event_date === todayStr && (t.includes('half day') || t.includes('inset') || t.includes('1:30'))
  })

  // Weekend
  if (isWeekend(now)) {
    const nextDay = day === 6 ? 'Monday' : 'Monday'
    return { emoji: '😊', message: `Enjoy the weekend — back on ${nextDay} at 8:25am`, colour: 'bg-gray-700/40' }
  }

  // Half day override
  if (halfDay) {
    if (timeVal < 13 * 60 + 30) {
      return { emoji: '⏰', message: 'Half day today — school finishes at 1:30pm', colour: 'bg-amber-800/40' }
    } else {
      return { emoji: '🏠', message: 'Half day — school has finished for today', colour: 'bg-gray-700/40' }
    }
  }

  // Time-based status
  if (timeVal < 8 * 60 + 25) {
    return { emoji: '🌅', message: 'School gates open at 8:25am', colour: 'bg-amber-800/40' }
  }
  if (timeVal < 8 * 60 + 45) {
    return { emoji: '🚶', message: 'Gates are open — see you inside!', colour: 'bg-green-900/40' }
  }
  if (timeVal < 14 * 60 + 30) {
    return { emoji: '📚', message: 'School is in session', colour: 'bg-blue-900/40' }
  }
  if (timeVal < 15 * 60 + 30) {
    return { emoji: '🔔', message: 'School finishes at 3:30pm', colour: 'bg-amber-800/40' }
  }
  if (timeVal < 18 * 60) {
    if (CLUB_DAYS.includes(day)) {
      return { emoji: '⚽', message: 'After-school club finishes at 6pm', colour: 'bg-purple-900/40' }
    }
    return { emoji: '🏠', message: 'School is out for the day', colour: 'bg-gray-700/40' }
  }

  // Evening
  const isFriday = day === 5
  const nextDayName = isFriday ? 'Monday' : 'tomorrow'
  return { emoji: '🌙', message: `School closed — see you ${nextDayName}`, colour: 'bg-gray-700/40' }
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function getGreetingEmoji(): string {
  const h = new Date().getHours()
  if (h < 6)  return '🌙'
  if (h < 12) return '☀️'
  if (h < 18) return '🌤️'
  return '🌙'
}

// ── Tag helpers ───────────────────────────────────────────────────────────────

const TAG_EMOJIS: Record<string, string> = {
  'Year 1': '📅', 'Phonics': '🔤', 'Trip': '🚌', 'Trips': '🚌',
  'Parents Evening': '👨‍👩‍👧', 'Reading': '📚', 'Sport': '⚽', 'Sports': '⚽',
  'Music': '🎵', 'Art': '🎨', 'Clubs': '🎯', 'Club': '🎯',
  'Uniform': '👕', 'Finance': '💰', 'General': '📋', 'Community': '🤝',
  'Health': '💊', 'Safety': '🛡️', 'Holiday': '🏖️', 'Closure': '🔒',
  'Reminder': '⏰', 'Deadline': '📌', 'Event': '🎉', 'Workshop': '🛠️',
  'Fundraising': '🎗️', 'PTA': '👋', 'Food': '🍱', 'Wellbeing': '💚',
}

function getTagEmoji(tag: string): string {
  const key = Object.keys(TAG_EMOJIS).find(k => tag.toLowerCase().includes(k.toLowerCase()))
  return key ? TAG_EMOJIS[key] : '📌'
}

function isYear1Tag(tag: string): boolean {
  const t = tag.toLowerCase()
  return t.includes('year 1') || t.includes('yr1') || t.includes('y1') || t.includes('phonics')
}

// ── Skeleton component ────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [emails, setEmails] = useState<EmailSummary[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [nearbyEvents, setNearbyEvents] = useState<Pick<CalendarEvent, 'id' | 'event_date' | 'title' | 'event_type' | 'description'>[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherError, setWeatherError] = useState(false)
  const [trendingTags, setTrendingTags] = useState<{ tag: string; summary: string; emailId: string }[]>([])
  const [year1Cards, setYear1Cards] = useState<{ tag: string; summary: string; emailId: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [now] = useState(new Date())

  const loadData = useCallback(async () => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const windowStart = format(addDays(new Date(), -1), 'yyyy-MM-dd')
      const windowEnd = format(addDays(new Date(), 45), 'yyyy-MM-dd')

      const [emailsRes, upcomingRes, nearbyRes, weatherRes] = await Promise.all([
        supabase.from('email_summaries').select('*').order('date_received', { ascending: false }).limit(20),
        supabase.from('calendar_events').select('*').gte('event_date', todayStr).order('event_date', { ascending: true }).limit(5),
        supabase.from('calendar_events').select('id,event_date,title,event_type,description').gte('event_date', windowStart).lte('event_date', windowEnd),
        fetch('/api/weather').then(r => r.json()).catch(() => null),
      ])

      const allEmails: EmailSummary[] = emailsRes.data || []
      setEmails(allEmails)
      setUpcomingEvents(upcomingRes.data || [])
      setNearbyEvents(nearbyRes.data || [])

      if (weatherRes && !weatherRes.error) {
        setWeather(weatherRes)
      } else {
        setWeatherError(true)
      }

      // Build tag cards — track best email per tag
      const tagMap = new Map<string, { summary: string; emailId: string; isYear1: boolean; date: string }>()
      for (const email of allEmails) {
        for (const tag of (email.tags || [])) {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, {
              summary: email.summary.split('.')[0] + '.',
              emailId: email.id,
              isYear1: isYear1Tag(tag),
              date: email.date_received,
            })
          }
        }
      }

      const y1 = Array.from(tagMap.entries())
        .filter(([, v]) => v.isYear1)
        .map(([tag, v]) => ({ tag, summary: v.summary, emailId: v.emailId }))

      const trending = Array.from(tagMap.entries())
        .filter(([tag]) => !isYear1Tag(tag))
        .slice(0, 8)
        .map(([tag, v]) => ({ tag, summary: v.summary, emailId: v.emailId }))

      setYear1Cards(y1)
      setTrendingTags(trending)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const status = getSchoolStatus(now, nearbyEvents)
  const latest3 = emails.slice(0, 3)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-[#F9FAFB]">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1A1A1A] via-[#2A1520] to-[#1A1A2A] text-white px-5 pt-5 pb-6">
        <div className="max-w-4xl mx-auto">

          {/* Greeting row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-2xl font-bold tracking-tight">
                {getGreeting()} {getGreetingEmoji()}
              </p>
              <p className="text-sm text-white/60 mt-0.5">
                {format(now, 'EEEE, d MMMM yyyy')}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-white/10 transition-colors mt-0.5"
              aria-label="Refresh"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 text-white/60 ${refreshing ? 'animate-spin' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* School status badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium mb-5 ${status.colour} backdrop-blur-sm border border-white/10`}>
            <span className="text-base">{status.emoji}</span>
            <span>{status.message}</span>
          </div>

          {/* Weather */}
          {loading ? (
            <div className="flex gap-3">
              <Skeleton className="h-24 flex-1" />
              <Skeleton className="h-24 flex-1" />
            </div>
          ) : weatherError ? null : weather ? (
            <div>
              <div className="flex gap-3 mb-3">
                {/* Today */}
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Today</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{weather.today.icon}</span>
                    <div>
                      <p className="text-2xl font-bold leading-none">{weather.today.temp}°</p>
                      <p className="text-[11px] text-white/60 mt-0.5 capitalize">{weather.today.description}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 mt-2">↑{weather.today.high}° ↓{weather.today.low}°</p>
                </div>
                {/* Tomorrow */}
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Tomorrow</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{weather.tomorrow.icon}</span>
                    <div>
                      <p className="text-2xl font-bold leading-none">{weather.tomorrow.temp}°</p>
                      <p className="text-[11px] text-white/60 mt-0.5 capitalize">{weather.tomorrow.description}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 mt-2">↑{weather.tomorrow.high}° ↓{weather.tomorrow.low}°</p>
                </div>
              </div>
              {weather.clothingTip && (
                <div className="flex items-start gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
                  <span className="text-base mt-0.5">🧥</span>
                  <p className="text-sm text-white/80 leading-snug">{weather.clothingTip}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-7">

        {/* ── LATEST FROM SCHOOL ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#6B7280]">Latest from school</h2>
            <button onClick={() => router.push('/feed')} className="text-xs text-[#D00A2C] font-medium hover:underline">
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 bg-gray-200 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {latest3.map((email, i) => (
                <button
                  key={email.id}
                  onClick={() => router.push(`/feed?email=${email.id}`)}
                  className="w-full text-left bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                          {format(parseISO(email.date_received), 'd MMM yyyy')}
                        </span>
                        {i === 0 && (
                          <span className="text-[10px] font-semibold bg-[#D00A2C] text-white px-1.5 py-0.5 rounded-full">NEW</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#111827] mt-0.5 line-clamp-1">{email.subject}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{email.summary}</p>
                    </div>
                    <span className="text-xs text-[#D00A2C] font-medium flex-shrink-0 mt-1">Read →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── FOR YEAR 1 PARENTS ──────────────────────────────────────────── */}
        {(loading || year1Cards.length > 0) && (
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[#6B7280]">For Year 1 parents</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Based on recent newsletters</p>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-hidden">
                {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-48 flex-shrink-0 bg-gray-200 rounded-xl" />)}
              </div>
            ) : (
              /* Mobile: horizontal scroll — Desktop: grid */
              <div className="flex gap-3 overflow-x-auto pb-2 sm:overflow-visible sm:grid sm:grid-cols-3 lg:grid-cols-4 snap-x snap-mandatory sm:snap-none">
                {year1Cards.map(({ tag, summary, emailId }) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/feed?tag=${encodeURIComponent(tag)}`)}
                    className="min-w-[200px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink text-left bg-white rounded-xl border border-[#E5E7EB] p-4 hover:shadow-md hover:border-[#D00A2C]/30 transition-all"
                  >
                    <div className="text-2xl mb-2">{getTagEmoji(tag)}</div>
                    <p className="text-sm font-semibold text-[#111827] line-clamp-1">{tag}</p>
                    <p className="text-xs text-[#6B7280] mt-1 line-clamp-3">{summary}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── TRENDING AT SCHOOL ──────────────────────────────────────────── */}
        {(loading || trendingTags.length > 0) && (
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[#6B7280]">Trending at school</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Most mentioned across emails &amp; website</p>
            </div>
            {loading ? (
              <div className="flex gap-3 overflow-hidden">
                {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-48 flex-shrink-0 bg-gray-200 rounded-xl" />)}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 sm:overflow-visible sm:grid sm:grid-cols-3 lg:grid-cols-4 snap-x snap-mandatory sm:snap-none">
                {trendingTags.map(({ tag, summary, emailId }) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/feed?tag=${encodeURIComponent(tag)}`)}
                    className="min-w-[200px] sm:min-w-0 snap-start flex-shrink-0 sm:flex-shrink text-left bg-white rounded-xl border border-[#E5E7EB] p-4 hover:shadow-md hover:border-[#D00A2C]/30 transition-all"
                  >
                    <div className="text-2xl mb-2">{getTagEmoji(tag)}</div>
                    <p className="text-sm font-semibold text-[#111827] line-clamp-1">{tag}</p>
                    <p className="text-xs text-[#6B7280] mt-1 line-clamp-3">{summary}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── COMING UP ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#6B7280]">Coming up</h2>
            <button onClick={() => router.push('/calendar')} className="text-xs text-[#D00A2C] font-medium hover:underline">
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14 bg-gray-200 rounded-xl" />)}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-[#6B7280] text-center py-4">No upcoming events</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <CalendarEventItem
                  key={event.id}
                  event={event}
                  onClick={() => router.push('/calendar')}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── ASK BANNER ──────────────────────────────────────────────────── */}
        <section>
          <button
            onClick={() => router.push('/ask')}
            className="w-full bg-[#1A1A1A] text-white rounded-2xl p-6 text-left hover:bg-[#2A1520] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold mb-1">✦ Got a question about school?</p>
                <p className="text-sm text-white/60">Search across newsletters, PDFs and the school website</p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 bg-[#D00A2C] text-white text-sm font-semibold px-4 py-2 rounded-full">
              Ask now →
            </div>
          </button>
        </section>

        {/* bottom spacing for mobile nav */}
        <div className="h-2" />
      </div>
    </div>
  )
}
