'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarEvent, EmailSummary } from '@/lib/types'
import CalendarEventItem from '@/components/CalendarEventItem'
import CalendarEventPanel from '@/components/CalendarEventPanel'
import { format, parseISO, isAfter, startOfToday } from 'date-fns'

const EVENT_TYPES = ['Deadline', 'Event', 'Reminder', 'Closure', 'Finance', 'General', 'Sport', 'Community'] as const

const YEAR_GROUPS = [
  { label: 'Rec',  terms: ['reception', 'eyfs', 'nursery'] },
  { label: 'Y1',   terms: ['year 1', 'y1', 'yr1', 'yr 1'] },
  { label: 'Y2',   terms: ['year 2', 'y2', 'yr2', 'yr 2'] },
  { label: 'Y3',   terms: ['year 3', 'y3', 'yr3', 'yr 3'] },
  { label: 'Y4',   terms: ['year 4', 'y4', 'yr4', 'yr 4'] },
  { label: 'Y5',   terms: ['year 5', 'y5', 'yr5', 'yr 5'] },
  { label: 'Y6',   terms: ['year 6', 'y6', 'yr6', 'yr 6'] },
]

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selected, setSelected] = useState<CalendarEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<EmailSummary | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true })
      .then(({ data }) => { setEvents(data || []); setLoading(false) })
  }, [])

  const openDetail = (event: CalendarEvent) => {
    setSelected(event)
    requestAnimationFrame(() => setDetailOpen(true))
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setTimeout(() => setSelected(null), 300)
  }

  const today = startOfToday()

  const filtered = events.filter(e => {
    const date = parseISO(e.event_date)
    if (filter === 'upcoming' && !isAfter(date, today) && format(date, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')) return false
    if (filter === 'past' && (isAfter(date, today) || format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))) return false
    if (typeFilter && e.event_type !== typeFilter) return false
    if (yearFilter) {
      const group = YEAR_GROUPS.find(g => g.label === yearFilter)
      const text = (e.title + ' ' + (e.description || '') + ' ' + (e.action_text || '')).toLowerCase()
      if (!group?.terms.some(t => text.includes(t))) return false
    }
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group by month
  const grouped = filtered.reduce((acc, event) => {
    const month = format(parseISO(event.event_date), 'MMMM yyyy')
    if (!acc[month]) acc[month] = []
    acc[month].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search events…"
          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D00A2C] focus:border-transparent"
        />

        {/* Upcoming / Past / All */}
        <div className="flex gap-2">
          {(['upcoming', 'past', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-[#1A1A1A] text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap">
          {EVENT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-[#D00A2C] text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Year group filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-[#9CA3AF] font-medium">Year:</span>
          {YEAR_GROUPS.map(g => (
            <button
              key={g.label}
              onClick={() => setYearFilter(yearFilter === g.label ? null : g.label)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                yearFilter === g.label
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Grouped events */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 border-l-4 border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-[#6B7280]">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-sm">No events found</p>
          </div>
        ) : (
          Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2 px-1">
                {month}
              </h2>
              <div className="space-y-2">
                {monthEvents.map(event => (
                  <CalendarEventItem
                    key={event.id}
                    event={event}
                    onClick={() => openDetail(event)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right: detail panel */}
      {selected && (
        <CalendarEventPanel
          event={selected}
          open={detailOpen}
          onClose={closeDetail}
          onSelectEmail={setSelectedEmail}
        />
      )}
    </div>
  )
}
