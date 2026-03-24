import { CalendarEvent, EVENT_TYPE_COLOURS, EVENT_TYPE_BG } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface Props {
  event: CalendarEvent
  onClick: () => void
}

const TYPE_LABEL_COLOURS: Record<CalendarEvent['event_type'], string> = {
  Deadline:  'text-[#D00A2C]',
  Event:     'text-blue-700',
  Closure:   'text-amber-800',
  Finance:   'text-emerald-800',
  Reminder:  'text-violet-800',
  General:   'text-gray-700',
  Sport:     'text-sky-700',
  Community: 'text-purple-700',
}

export default function CalendarEventItem({ event, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-[#E5E7EB] border-l-4 px-4 py-3 bg-white hover:shadow-md transition-all duration-150"
      style={{ borderLeftColor: EVENT_TYPE_COLOURS[event.event_type] }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A] line-clamp-1">{event.title}</p>
          {event.description && (
            <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{event.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end flex-shrink-0 gap-1">
          <span className="text-sm font-semibold text-[#1A1A1A]">
            {format(parseISO(event.event_date), 'd MMM')}
          </span>
          <span className={`text-xs font-medium uppercase tracking-wide ${TYPE_LABEL_COLOURS[event.event_type]}`}>
            {event.event_type}
          </span>
        </div>
      </div>
    </button>
  )
}
