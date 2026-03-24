'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SUGGESTIONS = [
  'When is the next parents evening?',
  'What is the uniform policy?',
  'What after-school clubs are available?',
  'When does term end?',
  'How do I pay for school meals?',
  'What time does school start and finish?',
]

type Source = {
  label: string
  type: 'email' | 'pdf' | 'website' | 'manual_pdf'
  url: string | null
  emailId: string | null
}

type Result = {
  answer: string
  sources: Source[]
}

export default function AskPage() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ask = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed || loading) return

    setQuestion(trimmed)
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ask(question)
  }

  const handleSuggestion = (s: string) => {
    setQuestion(s)
    ask(s)
  }

  const handleSourceClick = (source: Source) => {
    if (source.type === 'email' || source.type === 'pdf') {
      if (source.emailId) {
        router.push(`/feed?email=${source.emailId}`)
      }
    } else if (source.url) {
      window.open(source.url, '_blank', 'noopener,noreferrer')
    }
  }

  const sourceIcon = (type: Source['type']) => {
    if (type === 'email' || type === 'pdf') return '📧'
    if (type === 'website') return '🌐'
    return '📄'
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-2xl w-full mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Ask about school information</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Search across newsletters, PDFs and the school website
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 border border-[#E5E7EB] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D00A2C] focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="bg-[#D00A2C] text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-[#A00820] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? 'Asking…' : 'Ask'}
          </button>
        </form>

        {/* Suggestions — only show when no result and not loading */}
        {!result && !loading && !error && (
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Try asking</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-left px-4 py-3 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:border-[#D00A2C] hover:text-[#D00A2C] transition-colors bg-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider when there's content below */}
        {(loading || result || error) && (
          <hr className="border-[#E5E7EB]" />
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#D00A2C]">✦</span>
                <span className="text-sm font-semibold text-[#111827]">Answer</span>
              </div>
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-4/6" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Answer card */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#D00A2C] text-lg">✦</span>
                <span className="text-sm font-semibold text-[#111827]">Answer</span>
              </div>
              <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </p>
            </div>

            {/* Sources */}
            {result.sources.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
                  Sources
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.sources.map((source, i) => (
                    <button
                      key={i}
                      onClick={() => handleSourceClick(source)}
                      className="text-left flex items-center gap-2 px-4 py-3 border border-[#E5E7EB] rounded-lg bg-white hover:border-[#D00A2C] hover:text-[#D00A2C] transition-colors group"
                    >
                      <span className="text-base flex-shrink-0">{sourceIcon(source.type)}</span>
                      <span className="text-sm text-[#374151] group-hover:text-[#D00A2C] truncate transition-colors">
                        {source.label}
                      </span>
                      <span className="ml-auto text-[#6B7280] group-hover:text-[#D00A2C] flex-shrink-0 transition-colors">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ask another */}
            <button
              onClick={() => {
                setResult(null)
                setQuestion('')
                setError(null)
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              className="text-sm text-[#6B7280] hover:text-[#D00A2C] transition-colors"
            >
              ← Ask another question
            </button>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="text-center py-8 text-[#6B7280]">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-sm font-medium text-[#374151]">No question yet</p>
            <p className="text-xs mt-1">
              Type a question above to search across all newsletters, PDFs and school pages
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
