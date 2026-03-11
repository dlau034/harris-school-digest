'use client'

import { useEffect, useState } from 'react'
import { CalendarEvent, EmailSummary, EVENT_TYPE_COLOURS } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface Props {
  event: CalendarEvent
  open: boolean
  onClose: () => void
  onSelectEmail?: (email: EmailSummary) => void
}

export default function CalendarEventPanel({ event, open, onClose, onSelectEmail }: Props) {
  const [sourceEmails, setSourceEmails] = useState<EmailSummary[]>([])
  const [relatedEvents, setRelatedEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    if (event.source_email_ids.length === 0) return

    // Fetch source emails
    supabase
      .from('email_summaries')
      .select('*')
      .in('id', event.source_email_ids)
      .then(({ data }) => setSourceEmails(data || []))

    // Fetch related events sharing any source email
    supabase
      .from('calendar_events')
      .select('*')
      .overlaps('source_email_ids', event.source_email_ids)
      .neq('id', event.id)
      .order('event_date', { ascending: true })
      .then(({ data }) => setRelatedEvents(data || []))
  }, [event.id, event.source_email_ids])

  const typeColour = EVENT_TYPE_COLOURS[event.event_type]

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
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: typeColour + '33', color: typeColour === '#D00A2C' ? '#FCA5A5' : '#fff' }}
                >
                  {event.event_type}
                </span>
              </div>
              <h2 className="text-base font-semibold leading-snug">{event.title}</h2>
              <p className="text-sm text-white/60 mt-1">
                {format(parseISO(event.event_date), 'EEEE, d MMMM yyyy')}
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
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Action */}
          {event.action_text && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">
                What you need to do
              </p>
              <p className="text-sm text-[#111827] leading-relaxed bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3">
                {event.action_text}
              </p>
            </section>
          )}

          {/* Description */}
          {event.description && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">Details</p>
              <p className="text-sm text-[#374151] leading-relaxed">{event.description}</p>
            </section>
          )}

          {/* Source emails */}
          {sourceEmails.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">
                From these emails
              </p>
              <div className="space-y-2">
                {sourceEmails.map(email => (
                  <div key={email.id} className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                    <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">{email.subject}</p>
                    <p className="text-xs text-[#6B7280] mb-2">
                      {format(parseISO(email.date_received), 'd MMM yyyy')}
                    </p>
                    {onSelectEmail && (
                      <button
                        onClick={() => { onSelectEmail(email); onClose() }}
                        className="text-xs text-[#D00A2C] hover:text-[#A00820] font-medium"
                      >
                        View email →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related events */}
          {relatedEvents.length > 0 && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">
                Other events from same email
              </p>
              <div className="space-y-2">
                {relatedEvents.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                    <span
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EVENT_TYPE_COLOURS[e.event_type] }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">{e.title}</p>
                      <p className="text-xs text-[#6B7280]">{format(parseISO(e.event_date), 'd MMM yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* PDF from source email */}
          {sourceEmails.some(e => e.has_attachment && e.pdf_drive_url) && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">Attachment</p>
              {sourceEmails
                .filter(e => e.has_attachment && e.pdf_drive_url)
                .map(e => (
                  <div key={e.id} className="mb-2">
                    <p className="text-sm text-[#374151] mb-2">📎 {e.pdf_filename}</p>
                    <a
                      href={e.pdf_drive_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[#D00A2C] text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#A00820] transition-colors"
                    >
                      View PDF →
                    </a>
                  </div>
                ))}
            </section>
          )}
        </div>
      </div>
    </>
  )
}
