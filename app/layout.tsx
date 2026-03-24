'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { href: '/feed',     label: 'Email Feed' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/ask',      label: 'Ask' },
  ]

  return (
    <html lang="en" className="h-full">
      <head>
        <title>Harris School Digest</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-[#F9FAFB] font-sans antialiased">
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="bg-[#1A1A1A] text-white h-14 flex items-center px-4 flex-shrink-0">
            <div className="flex items-center gap-3 flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Harris"
                className="h-8 object-contain"
              />
              <span className="hidden sm:inline text-base font-bold tracking-tight">School Digest</span>
            </div>
            <nav className="flex gap-1 h-full items-stretch">
              {tabs.map(tab => {
                const active = pathname.startsWith(tab.href)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 flex items-center text-sm font-medium border-b-2 transition-colors ${
                      active
                        ? 'border-[#D00A2C] text-white'
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </nav>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
