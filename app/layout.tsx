'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { config, library } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { faHouse, faEnvelope, faCalendarDays, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Prevent Font Awesome from auto-adding CSS (we import it manually above)
config.autoAddCss = false
library.add(faHouse, faEnvelope, faCalendarDays, faWandMagicSparkles)

const NAV_TABS = [
  { href: '/home',     label: 'Home',     icon: faHouse },
  { href: '/feed',     label: 'Emails',   icon: faEnvelope },
  { href: '/calendar', label: 'Calendar', icon: faCalendarDays },
  { href: '/ask',      label: 'Ask',      icon: faWandMagicSparkles },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <html lang="en" className="h-full">
      <head>
        <title>Harris School Digest</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1A1A1A" />
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
                    className={`px-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                      active
                        ? 'border-[#D00A2C] text-white'
                        : 'border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="w-3.5 h-3.5" />
                    {tab.label}
                  </Link>
                )
              })}
            </nav>
          </header>

          {/* Page content — extra bottom padding on mobile for bottom nav */}
          <main className="flex-1 overflow-hidden pb-16 sm:pb-0">
            {children}
          </main>

          {/* Bottom nav — mobile only */}
          <nav
            className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] flex z-50"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
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
                  <FontAwesomeIcon icon={tab.icon} className="w-5 h-5" />
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
