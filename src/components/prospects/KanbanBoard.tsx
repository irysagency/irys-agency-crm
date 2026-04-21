'use client'

import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import { NicheFilter } from './NicheFilter'
import { ProspectDrawer } from './ProspectDrawer'
import { AddProspectModal } from './AddProspectModal'
import type { Prospect, NicheType } from '@/types'
import { STATUTS } from '@/types'

interface KanbanBoardProps {
  initialProspects: Prospect[]
}

export function KanbanBoard({ initialProspects }: KanbanBoardProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [nicheFilter, setNicheFilter] = useState<NicheType | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredProspects = nicheFilter
    ? prospects.filter(p => p.niche === nicheFilter)
    : prospects

  const handleProspectUpdate = useCallback((updated: Prospect) => {
    setProspects(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedProspect(updated)
  }, [])

  const handleProspectCreated = useCallback((prospect: Prospect) => {
    setProspects(prev => [prospect, ...prev])
  }, [])

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <NicheFilter selected={nicheFilter} onChange={setNicheFilter} />
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 rounded-lg text-sm font-medium text-white transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau prospect
        </button>
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

      <AddProspectModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleProspectCreated}
      />
    </>
  )
}
