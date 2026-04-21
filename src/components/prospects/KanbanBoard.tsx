'use client'

import { useState, useCallback } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { NicheFilter } from './NicheFilter'
import type { Prospect, StatutType, NicheType } from '@/types'
import { STATUTS } from '@/types'

interface KanbanBoardProps {
  initialProspects: Prospect[]
}

export function KanbanBoard({ initialProspects }: KanbanBoardProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [nicheFilter, setNicheFilter] = useState<NicheType | null>(null)

  const filteredProspects = nicheFilter
    ? prospects.filter(p => p.niche === nicheFilter)
    : prospects

  const handleProspectUpdate = useCallback((updated: Prospect) => {
    setProspects(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedProspect(updated)
  }, [])

  return (
    <>
      <div className="mb-6">
        <NicheFilter selected={nicheFilter} onChange={setNicheFilter} />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUTS.map(({ key, label }) => (
          <KanbanColumn
            key={key}
            statut={key}
            label={label}
            prospects={filteredProspects.filter(p => p.statut === key)}
            onCardClick={setSelectedProspect}
          />
        ))}
      </div>

      {/* TODO Task 8: Replace with <ProspectDrawer> once built */}
      {selectedProspect && (
        <div className="fixed bottom-4 right-4 bg-bg-card border border-border-color-subtle rounded-card px-4 py-2 text-sm text-text-secondary z-50">
          Sélectionné: {selectedProspect.nom} — Drawer à venir (Task 8)
        </div>
      )}
    </>
  )
}
