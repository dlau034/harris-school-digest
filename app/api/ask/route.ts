import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using service role (bypasses RLS for vector search)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`
const GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

// ── Embed a query string → 768-dimension vector ──────────────────────────────
async function embedText(text: string): Promise<number[]> {
  const res = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Embedding error: ${JSON.stringify(json)}`)
  return json.embedding.values
}

// ── Find top-k matching chunks via pgvector ───────────────────────────────────
async function searchDocuments(embedding: number[], count = 8) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.45,
    match_count: count,
  })
  if (error) throw new Error(`Vector search error: ${error.message}`)
  return data || []
}

// ── Generate answer from context ──────────────────────────────────────────────
async function generateAnswer(question: string, context: string): Promise<string> {
  const prompt = `You are a helpful assistant for parents at Harris Primary Academy Beckenham.
Answer the parent's question using ONLY the context provided below.
Be concise, friendly, and practical. If the context doesn't contain enough information to answer confidently, say so honestly.
Do not make up dates, prices, or specific details not present in the context.

CONTEXT:
${context}

PARENT'S QUESTION: ${question}

Answer:`

  const res = await fetch(GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Generation error: ${JSON.stringify(json)}`)
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? 'Sorry, I could not generate an answer.'
}

// ── POST /api/ask ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const trimmed = question.trim()

    // 1. Embed the question
    const embedding = await embedText(trimmed)

    // 2. Find relevant chunks
    const matches = await searchDocuments(embedding)

    if (matches.length === 0) {
      return NextResponse.json({
        answer: "I don't have enough information in my knowledge base to answer that question yet. Try asking about term dates, uniform, clubs, or recent newsletters.",
        sources: [],
      })
    }

    // 3. Build context string
    const context = matches
      .map((m: { source_label: string; content: string }, i: number) =>
        `[${i + 1}] (${m.source_label})\n${m.content}`
      )
      .join('\n\n')

    // 4. Generate answer
    const answer = await generateAnswer(trimmed, context)

    // 5. Deduplicate sources
    const seen = new Set<string>()
    const sources = matches
      .filter((m: { source_label: string; source_type: string; source_url: string | null; source_email_id: string | null }) => {
        if (seen.has(m.source_label)) return false
        seen.add(m.source_label)
        return true
      })
      .map((m: { source_label: string; source_type: string; source_url: string | null; source_email_id: string | null }) => ({
        label: m.source_label,
        type: m.source_type,
        url: m.source_url,
        emailId: m.source_email_id,
      }))

    return NextResponse.json({ answer, sources })
  } catch (err) {
    console.error('[/api/ask]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
