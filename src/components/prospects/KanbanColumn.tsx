'use client'

import { ProspectCard } from './ProspectCard'
import type { Prospect, StatutType } from '@/types'

const COLUMN_STYLES: Record<StatutType, { headerColor: string; dotColor: string }> = {
  a_contacter: { headerColor: 'text-text-secondary', dotColor: 'bg-text-secondary' },
  envoye: { headerColor: 'text-accent-violet', dotColor: 'bg-accent-violet' },
  ouvert: { headerColor: 'text-accent-warning', dotColor: 'bg-accent-warning' },
  repondu: { headerColor: 'text-blue-400', dotColor: 'bg-blue-400' },
  call_booke: { headerColor: 'text-accent-success', dotColor: 'bg-accent-success' },
  signe: { headerColor: 'text-accent-success', dotColor: 'bg-accent-success' },
  refuse: { headerColor: 'text-accent-danger', dotColor: 'bg-accent-danger' },
}

interface KanbanColumnProps {
  statut: StatutType
  label: string
  prospects: Prospect[]
  onCardClick: (prospect: Prospect) => void
}

export function KanbanColumn({ statut, label, prospects, onCardClick }: KanbanColumnProps) {
  const styles = COLUMN_STYLES[statut]

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${styles.dotColor}`} />
        <span className={`text-sm font-semibold ${styles.headerColor}`}>{label}</span>
        <span className="ml-auto text-xs text-text-secondary bg-white/5 px-2 py-0.5 rounded-full">
          {prospects.length}
        </span>
      </div>
      <div className="space-y-2 min-h-[100px]">
        {prospects.map(prospect => (
          <ProspectCard
            key={prospect.id}
            prospect={prospect}
            onClick={() => onCardClick(prospect)}
          />
        ))}
      </div>
    </div>
  )
}
