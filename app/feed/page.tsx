'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { EmailSummary } from '@/lib/types'
import EmailCard from '@/components/EmailCard'
import EmailDetailPanel from '@/components/EmailDetailPanel'

export default function FeedPage() {
  const searchParams = useSearchParams()
  const [emails, setEmails] = useState<EmailSummary[]>([])
  const [filtered, setFiltered] = useState<EmailSummary[]>([])
  const [selected, setSelected] = useState<EmailSummary | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('email_summaries')
      .select('*')
      .order('date_received', { ascending: false })
      .then(({ data }) => {
        const list = data || []
        setEmails(list)
        setFiltered(list)
        setLoading(false)

        const emailId = searchParams.get('email')
        if (emailId) {
          const target = list.find(e => e.id === emailId)
          if (target) {
            setSelected(target)
            requestAnimationFrame(() => setDetailOpen(true))
          }
        }
      })
  }, [searchParams])

  useEffect(() => {
    let result = emails
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.sender.toLowerCase().includes(q)
      )
    }
    if (activeTag) {
      result = result.filter(e => e.tags.includes(activeTag))
    }
    setFiltered(result)
  }, [search, activeTag, emails])

  const openDetail = (email: EmailSummary) => {
    setSelected(email)
    requestAnimationFrame(() => setDetailOpen(true))
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setTimeout(() => setSelected(null), 300)
  }

  const allTags = [...new Set(emails.flatMap(e => e.tags))].sort()

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emails…"
          className="w-full border border-[#E5E7EB] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D00A2C] focus:border-transparent"
        />

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-[#D00A2C] text-white'
                    : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg p-4 border border-[#E5E7EB] animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#6B7280]">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No emails found</p>
          </div>
        ) : (
          filtered.map(email => (
            <EmailCard
              key={email.id}
              email={email}
              onClick={() => openDetail(email)}
            />
          ))
        )}
      </div>

      {/* Right: detail panel */}
      {selected && (
        <EmailDetailPanel email={selected} open={detailOpen} onClose={closeDetail} />
      )}
    </div>
  )
}
