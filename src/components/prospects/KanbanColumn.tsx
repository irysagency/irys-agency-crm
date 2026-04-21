'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ProspectCard } from './ProspectCard'
import type { Prospect, StatutType } from '@/types'

const COLUMN_STYLES: Record<StatutType, { headerColor: string; dotColor: string; dropBg: string; dropBorder: string }> = {
  a_contacter: { headerColor: 'text-text-secondary', dotColor: 'bg-text-secondary', dropBg: 'bg-white/3', dropBorder: 'border-white/20' },
  envoye:      { headerColor: 'text-accent-violet',  dotColor: 'bg-accent-violet',  dropBg: 'bg-accent-violet/5', dropBorder: 'border-accent-violet/40' },
  ouvert:      { headerColor: 'text-accent-warning', dotColor: 'bg-accent-warning', dropBg: 'bg-accent-warning/5', dropBorder: 'border-accent-warning/40' },
  repondu:     { headerColor: 'text-blue-400',       dotColor: 'bg-blue-400',       dropBg: 'bg-blue-400/5', dropBorder: 'border-blue-400/40' },
  call_booke:  { headerColor: 'text-accent-success', dotColor: 'bg-accent-success', dropBg: 'bg-accent-success/5', dropBorder: 'border-accent-success/40' },
  signe:       { headerColor: 'text-accent-success', dotColor: 'bg-accent-success', dropBg: 'bg-accent-success/5', dropBorder: 'border-accent-success/40' },
  refuse:      { headerColor: 'text-accent-danger',  dotColor: 'bg-accent-danger',  dropBg: 'bg-accent-danger/5', dropBorder: 'border-accent-danger/40' },
}

interface KanbanColumnProps {
  statut: StatutType
  label: string
  prospects: Prospect[]
  onCardClick: (prospect: Prospect) => void
  isDragOver: boolean
  draggingId: string | null
}

export function KanbanColumn({ statut, label, prospects, onCardClick, isDragOver, draggingId }: KanbanColumnProps) {
  const styles = COLUMN_STYLES[statut]

  const { setNodeRef } = useDroppable({ id: statut })

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${styles.dotColor}`} />
        <span className={`text-sm font-semibold ${styles.headerColor}`}>{label}</span>
        <span className="ml-auto text-xs text-text-secondary bg-white/5 px-2 py-0.5 rounded-full">
          {prospects.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[100px] rounded-xl border-2 border-dashed transition-all duration-200 p-2 space-y-2 ${
          isDragOver
            ? `${styles.dropBg} ${styles.dropBorder}`
            : 'border-transparent'
        }`}
      >
        <SortableContext items={prospects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {prospects.map(prospect => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              onClick={() => onCardClick(prospect)}
              isDragging={draggingId === prospect.id}
            />
          ))}
        </SortableContext>

        {isDragOver && prospects.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-text-secondary">
            Déposer ici
          </div>
        )}
      </div>
    </div>
  )
}
