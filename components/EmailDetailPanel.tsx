'use client'

import { useEffect, useState } from 'react'
import { EmailSummary, CalendarEvent, EVENT_TYPE_COLOURS } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface Props {
  email: EmailSummary
  open: boolean
  onClose: () => void
}

export default function EmailDetailPanel({ email, open, onClose }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    supabase
      .from('calendar_events')
      .select('*')
      .contains('source_email_ids', [email.id])
      .order('event_date', { ascending: true })
      .then(({ data }) => setEvents(data || []))
  }, [email.id])

  return (
    <>
      {/* Panel — mobile: full-screen slide from right | desktop: static sidebar */}
      <div
        className={`
          fixed inset-0 z-20 bg-white flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
          md:static md:translate-x-0 md:w-[420px] md:h-full md:shadow-xl md:transition-none
        `}
      >
        {/* Header */}
        <div className="bg-[#1A1A1A] text-white px-6 py-4 flex-shrink-0">
          {/* Mobile back button */}
          <button
            onClick={onClose}
            className="md:hidden flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium mb-3 -ml-1 transition-colors"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold leading-snug">{email.subject}</h2>
              <p className="text-xs text-white/60 mt-1">
                {email.sender} · {format(parseISO(email.date_received), 'd MMM yyyy')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-[#D00A2C] transition-colors text-xl leading-none flex-shrink-0 mt-0.5"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tags */}
          {email.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {email.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Summary */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">Summary</p>
            <ul className="space-y-1.5">
              {email.summary
                .split(/(?<=[.!?])\s+/)
                .filter(s => s.trim().length > 0)
                .map((sentence, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#111827] leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#D00A2C] flex-shrink-0" />
                    {sentence.trim()}
                  </li>
                ))}
            </ul>
          </section>

          {/* Events from this email */}
          {events.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">
                Events from this email
              </p>
              <div className="space-y-2">
                {events.map(event => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]"
                  >
                    <span
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: EVENT_TYPE_COLOURS[event.event_type] }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">{event.title}</p>
                      <p className="text-xs text-[#6B7280]">
                        {format(parseISO(event.event_date), 'd MMM yyyy')} · {event.event_type}
                      </p>
                      {event.action_text && (
                        <p className="text-xs text-[#374151] mt-1">{event.action_text}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Attachment */}
          {email.has_attachment && email.pdf_drive_url && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">Attachment</p>
              <p className="text-sm text-[#374151] mb-3">📎 {email.pdf_filename}</p>
              <a
                href={email.pdf_drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#D00A2C] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#A00820] transition-colors"
              >
                View PDF →
              </a>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
