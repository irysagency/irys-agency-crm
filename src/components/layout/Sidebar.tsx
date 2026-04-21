'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, Bell, Settings, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'

export function Sidebar() {
  const pathname = usePathname()
  const [relanceCount, setRelanceCount] = useState(0)

  useEffect(() => {
    async function fetchRelances() {
      const supabase = createClient()
      const { data } = await supabase
        .from('prospects')
        .select('statut, derniere_action')
        .in('statut', ['envoye', 'ouvert'])

      if (!data) return
      const now = Date.now()
      const count = data.filter(p => {
        if (!p.derniere_action) return false
        const delaiMs = (p.statut === 'ouvert' ? 2 : 4) * 86400000
        return now - new Date(p.derniere_action).getTime() > delaiMs
      }).length
      setRelanceCount(count)
    }
    fetchRelances()
  }, [])

  const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: "Vue d'ensemble", badge: 0 },
    { href: '/prospects', icon: Users, label: 'Prospects', badge: 0 },
    { href: '/relances', icon: Bell, label: 'Relances', badge: relanceCount },
    { href: '/settings', icon: Settings, label: 'Paramètres', badge: 0 },
  ] as const

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
        {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
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
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-accent-warning text-bg-sidebar text-xs font-bold rounded-full">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
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
