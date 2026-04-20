'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  Zap,
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: "Vue d'ensemble" },
  { href: '/prospects', icon: Users, label: 'Prospects' },
  { href: '/relances', icon: Bell, label: 'Relances' },
  { href: '/settings', icon: Settings, label: 'Paramètres' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-bg-sidebar border-r border-border-color-subtle flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border-color-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-violet flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-text-primary">Irys CRM</p>
            <p className="text-xs text-text-secondary">Prospection</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-accent-violet/15 text-accent-violet'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border-color-subtle">
        <p className="text-xs text-text-secondary">Irys Agency © 2026</p>
      </div>
    </aside>
  )
}
