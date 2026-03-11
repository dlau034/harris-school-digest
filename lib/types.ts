export interface EmailSummary {
  id: string
  gmail_message_id: string
  date_received: string
  subject: string
  sender: string
  summary: string
  tags: string[]
  has_attachment: boolean
  pdf_filename: string | null
  pdf_drive_url: string | null
  processed_at: string
}

export interface CalendarEvent {
  id: string
  event_date: string
  title: string
  description: string | null
  event_type: 'Deadline' | 'Event' | 'Reminder' | 'Closure' | 'Finance' | 'General' | 'Sport' | 'Community'
  action_text: string | null
  source_email_ids: string[]
  first_seen: string
  last_mentioned: string
}

export const EVENT_TYPE_COLOURS: Record<CalendarEvent['event_type'], string> = {
  Deadline:  '#D00A2C',
  Event:     '#1D4ED8',
  Closure:   '#92400E',
  Finance:   '#065F46',
  Reminder:  '#5B21B6',
  General:   '#374151',
  Sport:     '#0369A1',
  Community: '#6D28D9',
}

export const EVENT_TYPE_BG: Record<CalendarEvent['event_type'], string> = {
  Deadline:  'bg-[#FDF0F2]',
  Event:     'bg-blue-50',
  Closure:   'bg-amber-50',
  Finance:   'bg-emerald-50',
  Reminder:  'bg-violet-50',
  General:   'bg-gray-50',
  Sport:     'bg-sky-50',
  Community: 'bg-purple-50',
}
