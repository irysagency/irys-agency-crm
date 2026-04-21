'use client'

import { useState, useCallback } from 'react'
import { KanbanColumn } from './KanbanColumn'
import { NicheFilter } from './NicheFilter'
import { ProspectDrawer } from './ProspectDrawer'
import type { Prospect, NicheType } from '@/types'
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

      <ProspectDrawer
        prospect={selectedProspect}
        onUpdate={handleProspectUpdate}
        onClose={() => setSelectedProspect(null)}
      />
    </>
  )
}
