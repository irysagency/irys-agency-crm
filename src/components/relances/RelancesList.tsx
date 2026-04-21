'use client'

import { useState, useCallback } from 'react'
import { RelanceRow } from './RelanceRow'
import { ProspectDrawer } from '@/components/prospects/ProspectDrawer'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Prospect } from '@/types'

interface RelancesListProps {
  initialProspects: Prospect[]
}

export function RelancesList({ initialProspects }: RelancesListProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)

  const handleUpdate = useCallback((updated: Prospect) => {
    setProspects(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedProspect(updated)
  }, [])

  if (prospects.length === 0) {
    return (
      <EmptyState
        title="Aucune relance en attente"
        description="Tous vos prospects ont été contactés récemment."
      />
    )
  }

  return (
    <>
      <div className="space-y-3">
        {prospects.map(prospect => (
          <RelanceRow
            key={prospect.id}
            prospect={prospect}
            onClick={setSelectedProspect}
          />
        ))}
      </div>

      <ProspectDrawer
        prospect={selectedProspect}
        onUpdate={handleUpdate}
        onClose={() => setSelectedProspect(null)}
      />
    </>
  )
}
