import { EmailSummary } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface Props {
  email: EmailSummary
  onClick: () => void
}

export default function EmailCard({ email, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-[#E5E7EB] rounded-lg p-4 hover:shadow-md hover:border-l-4 hover:border-l-[#D00A2C] transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-base font-semibold text-[#1A1A1A] line-clamp-1 group-hover:text-[#D00A2C] transition-colors">
          {email.subject}
        </h3>
        <span className="text-xs text-[#6B7280] whitespace-nowrap flex-shrink-0">
          {format(parseISO(email.date_received), 'd MMM yyyy')}
        </span>
      </div>

      <p className="text-xs text-[#6B7280] mb-2 line-clamp-1">{email.sender}</p>

      <p className="text-sm text-[#111827] leading-relaxed line-clamp-3 mb-3">
        {email.summary}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {email.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#374151] text-xs font-medium"
          >
            {tag}
          </span>
        ))}
        {email.has_attachment && (
          <span className="ml-auto text-[#D00A2C] text-sm hover:text-[#A00820] font-medium">
            📎 PDF
          </span>
        )}
      </div>
    </button>
  )
}
