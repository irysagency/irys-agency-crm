'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { NicheBadge } from '@/components/ui/Badge'
import { getInitials } from '@/lib/utils'
import type { Prospect } from '@/types'

const NICHE_COLORS: Record<string, string> = {
  'Tech & IA':                   'oklch(0.58 0.14 245)',
  'Creator Economy':             'oklch(0.64 0.18 340)',
  'Entrepreneur':                'oklch(0.64 0.16 35)',
  'Marketing & Vente':           'oklch(0.62 0.14 155)',
  'Finance & Wealth':            'oklch(0.62 0.14 210)',
  'Ecommerce':                   'oklch(0.58 0.16 295)',
  'Make Money & Trends':         'oklch(0.62 0.14 100)',
  'Productivité & Second Brain': 'oklch(0.58 0.14 180)',
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  return `Il y a ${diffDays}j`
}

interface ProspectCardProps {
  prospect: Prospect
  onClick: () => void
  isDragging?: boolean
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
}

export function ProspectCard({ prospect, onClick, isDragging = false, isSelected = false, onSelect }: ProspectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: prospect.id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const nicheColor = NICHE_COLORS[prospect.niche] ?? '#8A8F97'
  const initials = getInitials(prospect.nom)

  if (isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-[#FAFBFC] border border-dashed border-[#E5E7EB] rounded-[10px] p-[10px_11px] opacity-40 h-[76px]"
      />
    )
  }

  function handleClick(e: React.MouseEvent) {
    if (onSelect) { e.stopPropagation(); onSelect(prospect.id, !isSelected) }
    else onClick()
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation()
    onSelect?.(prospect.id, !isSelected)
  }

  const channelIcon = prospect.canal_contact === 'email' ? '✉'
    : prospect.canal_contact === 'instagram' ? '◉'
    : prospect.canal_contact === 'whatsapp' ? '💬'
    : prospect.contacte_email ? '✉'
    : prospect.contacte_instagram ? '◉'
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(onSelect ? {} : listeners)}
      onClick={handleClick}
      className={[
        'relative bg-white border rounded-[10px] p-[10px_11px] transition-all duration-150 select-none',
        isSelected
          ? 'border-[oklch(0.62_0.14_155)] ring-2 ring-[oklch(0.95_0.04_155)] cursor-pointer'
          : onSelect
            ? 'border-[#E5E7EB] cursor-pointer hover:border-[#D6D9DE]'
            : 'border-[#E5E7EB] cursor-grab active:cursor-grabbing hover:border-[#D6D9DE] hover:shadow-sm',
        isDragging ? 'shadow-lg ring-2 ring-[oklch(0.95_0.04_155)]' : '',
      ].join(' ')}
    >
      {/* Checkbox overlay in select mode */}
      {onSelect && (
        <div
          onClick={handleCheckboxClick}
          className={[
            'absolute top-2.5 right-2.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
            isSelected
              ? 'bg-[oklch(0.62_0.14_155)] border-[oklch(0.62_0.14_155)]'
              : 'border-[#BEC2C8] bg-white hover:border-[oklch(0.62_0.14_155)]',
          ].join(' ')}
        >
          {isSelected && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
              <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      {/* Header: avatar + name + channel */}
      <div className={['flex items-center gap-2 mb-2', onSelect ? 'pr-5' : ''].join(' ')}>
        <div
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
          style={{
            background: `color-mix(in oklch, ${nicheColor} 14%, white)`,
            color: `color-mix(in oklch, ${nicheColor} 70%, #000)`,
            border: `1px solid color-mix(in oklch, ${nicheColor} 25%, white)`,
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[#111316] truncate">{prospect.nom}</div>
        </div>
        {channelIcon && (
          <span className="text-[11px] text-[#8A8F97] flex-shrink-0">{channelIcon}</span>
        )}
      </div>

      {/* Footer: niche tag + time */}
      <div className="flex justify-between items-center">
        <NicheBadge niche={prospect.niche} />
        <span className="text-[10px] text-[#8A8F97] font-mono flex-shrink-0 ml-1">
          ◷ {formatRelativeDate(prospect.derniere_action)}
        </span>
      </div>
    </div>
  )
}
