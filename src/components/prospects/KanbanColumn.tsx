'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ProspectCard } from './ProspectCard'
import type { Prospect, StatutType } from '@/types'

const DOT_COLORS: Record<StatutType, string> = {
  a_contacter: '#8A8F97',
  envoye:      'oklch(0.58 0.14 245)',
  ouvert:      'oklch(0.72 0.14 75)',
  repondu:     'oklch(0.58 0.16 295)',
  call_booke:  'oklch(0.64 0.18 340)',
  signe:       'oklch(0.62 0.14 155)',
  refuse:      'oklch(0.62 0.18 25)',
}

interface KanbanColumnProps {
  statut: StatutType
  label: string
  prospects: Prospect[]
  onCardClick: (prospect: Prospect) => void
  isDragOver: boolean
  draggingId: string | null
  selectedIds?: Set<string>
  onSelect?: (id: string, selected: boolean) => void
}

export function KanbanColumn({ statut, label, prospects, onCardClick, isDragOver, draggingId, selectedIds, onSelect }: KanbanColumnProps) {
  const dotColor = DOT_COLORS[statut]
  const { setNodeRef } = useDroppable({ id: statut })

  return (
    <div className="w-[208px] flex-shrink-0 flex flex-col bg-[#FAFBFC] rounded-[12px] border border-[#E5E7EB] overflow-hidden">
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-[#E5E7EB] flex justify-between items-center">
        <div className="flex items-center gap-[7px]">
          <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: dotColor }} />
          <span className="text-[12px] font-semibold text-[#111316]">{label}</span>
        </div>
        <span className="text-[11px] font-mono text-[#8A8F97] bg-[#F4F5F7] px-[6px] py-[1px] rounded-[4px]">
          {prospects.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          'flex-1 overflow-auto p-2 flex flex-col gap-1.5 min-h-[80px] transition-colors duration-150',
          isDragOver ? 'bg-[oklch(0.95_0.04_155)]/30' : '',
        ].join(' ')}
      >
        <SortableContext items={prospects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {prospects.map(prospect => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              onClick={() => onCardClick(prospect)}
              isDragging={draggingId === prospect.id}
              isSelected={selectedIds?.has(prospect.id)}
              onSelect={onSelect}
            />
          ))}
        </SortableContext>

        {isDragOver && prospects.length === 0 && (
          <div className="flex items-center justify-center h-10 text-[11px] text-[#8A8F97] italic">
            Déposer ici
          </div>
        )}
      </div>
    </div>
  )
}
