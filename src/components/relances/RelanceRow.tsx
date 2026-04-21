'use client'

import { Clock } from 'lucide-react'
import { StatutBadge, NicheBadge } from '@/components/ui/Badge'
import type { Prospect } from '@/types'

interface RelanceRowProps {
  prospect: Prospect
  onClick: (prospect: Prospect) => void
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Il y a 1 jour'
  return `Il y a ${days} jours`
}

export function RelanceRow({ prospect, onClick }: RelanceRowProps) {
  return (
    <button
      onClick={() => onClick(prospect)}
      className="w-full flex items-center gap-4 px-5 py-4 bg-bg-card border border-border-color-subtle rounded-xl hover:border-accent-violet/40 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors truncate">
          {prospect.nom}
        </p>
        {prospect.derniere_action && (
          <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{timeSince(prospect.derniere_action)}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <NicheBadge niche={prospect.niche} />
        <StatutBadge statut={prospect.statut} />
      </div>
      <span className="text-xs font-medium text-accent-violet opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        Relancer →
      </span>
    </button>
  )
}
