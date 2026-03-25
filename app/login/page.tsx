'use client'

import { useState, useRef } from 'react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      window.location.href = '/home'
    } else {
      setLoading(false)
      setError(true)
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-6">

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Harris Primary" className="h-16 object-contain" />
        <p className="text-white/60 text-sm">School Digest</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-[#111827] mb-1">Welcome back</h1>
        <p className="text-sm text-[#6B7280] mb-6">Enter your password to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              placeholder="Password"
              autoFocus
              required
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-[#D00A2C]/30
                ${error
                  ? 'border-[#D00A2C] bg-[#FDF0F2] text-[#D00A2C] placeholder-[#D00A2C]/50'
                  : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#111827] focus:border-[#D00A2C]'
                }
                ${shake ? 'animate-shake' : ''}
              `}
            />
            {error && (
              <p className="text-xs text-[#D00A2C] mt-2 font-medium">
                Incorrect password — try again
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[#D00A2C] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#A00820] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Enter →'}
          </button>
        </form>
      </div>

      <p className="text-white/20 text-xs mt-8">Harris Primary Academy Beckenham</p>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.45s ease-in-out;
        }
      `}</style>
    </div>
  )
}
