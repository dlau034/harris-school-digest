'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_TABS = [
  {
    href: '/feed',
    label: 'Emails',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    href: '/ask',
    label: 'Ask',
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
              <img src="/logo.png" alt="Harris" className="h-8 object-contain" />
              <span className="hidden sm:inline text-base font-bold tracking-tight">School Digest</span>
            </div>
            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden sm:flex gap-1 h-full items-stretch">
              {NAV_TABS.map(tab => {
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

          {/* Page content — extra bottom padding on mobile for the bottom nav */}
          <main className="flex-1 overflow-hidden pb-16 sm:pb-0">
            {children}
          </main>

          {/* Bottom nav — mobile only */}
          <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] flex z-50"
               style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {NAV_TABS.map(tab => {
              const active = pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                    active ? 'text-[#D00A2C]' : 'text-[#6B7280]'
                  }`}
                >
                  {tab.icon(active)}
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </body>
    </html>
  )
}
