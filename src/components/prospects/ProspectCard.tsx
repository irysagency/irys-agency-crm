'use client'

import { Eye, Clock, RefreshCw } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { NicheBadge } from '@/components/ui/Badge'
import type { Prospect } from '@/types'

interface ProspectCardProps {
  prospect: Prospect
  onClick: () => void
  isDragging?: boolean
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

function needsFollowUp(prospect: Prospect): boolean {
  if (!prospect.derniere_action) return false
  if (prospect.statut !== 'envoye' && prospect.statut !== 'ouvert') return false
  const delai = prospect.statut === 'ouvert' ? 2 : 4
  const date = new Date(prospect.derniere_action)
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > delai
}

export function ProspectCard({ prospect, onClick, isDragging = false }: ProspectCardProps) {
  const needsRelance = needsFollowUp(prospect)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: prospect.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-bg-card border-2 border-dashed border-white/10 rounded-card p-4 opacity-40 h-[88px]"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-bg-card border border-border-color-subtle rounded-card p-4 cursor-grab active:cursor-grabbing hover:border-white/10 transition-all duration-150 group select-none ${
        isDragging ? 'shadow-2xl shadow-black/40 ring-2 ring-accent-violet/30' : 'hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm text-text-primary group-hover:text-accent-violet transition-colors">
          {prospect.nom}
        </h4>
        {needsRelance && (
          <div className="w-5 h-5 rounded-full bg-accent-warning/20 flex items-center justify-center flex-shrink-0 ml-2">
            <RefreshCw className="w-3 h-3 text-accent-warning" />
          </div>
        )}
      </div>

      <NicheBadge niche={prospect.niche} className="mb-3" />

      <div className="flex items-center justify-between mt-2">
        {prospect.nb_ouvertures > 0 && (
          <div className="flex items-center gap-1 text-xs text-accent-warning">
            <Eye className="w-3 h-3" />
            <span>{prospect.nb_ouvertures} ouverture{prospect.nb_ouvertures > 1 ? 's' : ''}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-text-secondary ml-auto">
          <Clock className="w-3 h-3" />
          <span>{formatRelativeDate(prospect.derniere_action)}</span>
        </div>
      </div>
    </div>
  )
}
