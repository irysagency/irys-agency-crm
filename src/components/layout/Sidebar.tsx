'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

// Custom SVG icons — 1.6px stroke, consistent visual weight
function IconDashboard() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}

function IconProspects() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="6" r="2.4" />
      <path d="M21 15c-.5-2-2-3.2-4-3.2" />
    </svg>
  )
}

function IconRelances() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4l2.5 1.5" />
      <circle cx="12" cy="13" r="8" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/',          Icon: IconDashboard,  label: "Vue d'ensemble", badge: false },
  { href: '/prospects', Icon: IconProspects,  label: 'Prospects',      badge: false },
  { href: '/relances',  Icon: IconRelances,   label: 'Relances',       badge: true  },
  { href: '/settings',  Icon: IconSettings,   label: 'Paramètres',     badge: false },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [relanceCount, setRelanceCount] = useState(0)

  useEffect(() => {
    fetch('/api/relances/count')
      .then(r => r.json())
      .then((d: { count?: number }) => setRelanceCount(d.count ?? 0))
      .catch(() => {})
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }, [])

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className="fixed left-0 top-0 h-screen bg-white border-r border-[#E5E7EB] flex flex-col overflow-hidden z-40"
      style={{
        width: expanded ? 220 : 64,
        padding: '20px 10px',
        gap: 4,
        transition: 'width 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-[10px] px-1 flex-shrink-0" style={{ marginBottom: 18, height: 36 }}>
        <div className="w-9 h-9 rounded-[10px] bg-[#111316] text-white flex items-center justify-center font-semibold text-base flex-shrink-0">
          I
        </div>
        <div
          className="overflow-hidden whitespace-nowrap"
          style={{ opacity: expanded ? 1 : 0, transition: 'opacity 140ms ease' }}
        >
          <div className="text-[13px] font-semibold tracking-[-0.01em] leading-[1.1] text-[#111316]">Irys CRM</div>
          <div className="text-[10px] font-mono text-[#8A8F97] mt-[2px]">Prospection</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1" style={{ gap: 3 }}>
        {NAV_ITEMS.map(({ href, Icon, label, badge }) => {
          const isActive = pathname === href
          const showBadge = badge && relanceCount > 0

          return (
            <Link
              key={href}
              href={href}
              title={expanded ? '' : label}
              className={[
                'relative flex items-center gap-3 px-[10px] rounded-[10px] h-10 flex-shrink-0 transition-colors',
                isActive
                  ? 'bg-[oklch(0.95_0.04_155)] text-[oklch(0.62_0.14_155)]'
                  : 'text-[#474B52] hover:bg-[#FAFBFC]',
              ].join(' ')}
            >
              {/* Icon */}
              <div className="w-5 flex items-center justify-center flex-shrink-0">
                <Icon />
              </div>

              {/* Label */}
              <div
                className="overflow-hidden whitespace-nowrap flex-1 min-w-0"
                style={{
                  opacity: expanded ? 1 : 0,
                  transition: 'opacity 140ms ease',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {label}
              </div>

              {/* Badge */}
              {showBadge && (
                <span
                  className="text-white font-mono font-semibold flex-shrink-0"
                  style={{
                    background: 'oklch(0.62 0.18 25)',
                    fontSize: 10,
                    borderRadius: 999,
                    padding: expanded ? '1px 7px' : '1px 5px',
                    position: expanded ? 'static' : 'absolute',
                    top: expanded ? 'auto' : 4,
                    right: expanded ? 'auto' : 4,
                    transition: 'padding 140ms ease',
                  }}
                >
                  {relanceCount > 99 ? '99+' : relanceCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div
        className="flex items-center gap-3 px-1 border-t border-[#E5E7EB] flex-shrink-0"
        style={{ paddingTop: 14, height: 44 }}
      >
        <div className="w-8 h-8 rounded-full bg-[oklch(0.95_0.04_155)] text-[oklch(0.62_0.14_155)] flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
          QD
        </div>
        <div
          className="overflow-hidden whitespace-nowrap flex-1 min-w-0"
          style={{ opacity: expanded ? 1 : 0, transition: 'opacity 140ms ease' }}
        >
          <div className="text-[12px] font-semibold text-[#111316] leading-[1.1]">Quentin Deleu</div>
          <div className="text-[10px] font-mono text-[#8A8F97] mt-[2px]">Admin · Irys</div>
        </div>

        {/* Bouton logout */}
        <button
          onClick={handleLogout}
          title="Déconnexion"
          className="flex-shrink-0 flex items-center justify-center rounded-[7px] text-[#8A8F97] hover:text-[oklch(0.62_0.18_25)] hover:bg-[#F4F5F7] transition-colors"
          style={{
            width: expanded ? 'auto' : 28,
            height: 28,
            padding: expanded ? '0 8px' : 0,
            gap: 5,
            opacity: expanded ? 1 : 0.5,
            transition: 'opacity 140ms ease, width 200ms cubic-bezier(0.2,0.8,0.2,1), padding 200ms cubic-bezier(0.2,0.8,0.2,1)',
          }}
        >
          {/* Icône power */}
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            <line x1="12" y1="2" x2="12" y2="12" />
          </svg>
          {expanded && (
            <span
              className="whitespace-nowrap overflow-hidden"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              Déconnexion
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
