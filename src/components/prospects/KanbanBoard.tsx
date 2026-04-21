'use client'

import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { ProspectCard } from './ProspectCard'
import { NicheFilter } from './NicheFilter'
import { ProspectDrawer } from './ProspectDrawer'
import { AddProspectModal } from './AddProspectModal'
import type { Prospect, NicheType, StatutType } from '@/types'
import { STATUTS } from '@/types'

interface KanbanBoardProps {
  initialProspects: Prospect[]
}

export function KanbanBoard({ initialProspects }: KanbanBoardProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [nicheFilter, setNicheFilter] = useState<NicheType | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null)
  const [overStatut, setOverStatut] = useState<StatutType | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filteredProspects = nicheFilter
    ? prospects.filter(p => p.niche === nicheFilter)
    : prospects

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string
    setActiveProspect(prospects.find(p => p.id === id) ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined
    if (!overId) { setOverStatut(null); return }
    const isColumn = STATUTS.some(s => s.key === overId)
    if (isColumn) { setOverStatut(overId as StatutType); return }
    const overProspect = prospects.find(p => p.id === overId)
    if (overProspect) setOverStatut(overProspect.statut)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveProspect(null)
    setOverStatut(null)
    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    // Determine target column
    const isColumn = STATUTS.some(s => s.key === overId)
    const targetStatut: StatutType = isColumn
      ? (overId as StatutType)
      : (prospects.find(p => p.id === overId)?.statut ?? null)!

    const dragged = prospects.find(p => p.id === draggedId)
    if (!dragged || dragged.statut === targetStatut) return

    // Optimistic update
    setProspects(prev =>
      prev.map(p => p.id === draggedId ? { ...p, statut: targetStatut } : p)
    )

    // Persist
    fetch(`/api/prospects/${draggedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: targetStatut }),
    }).catch(() => {
      // Rollback on error
      setProspects(prev =>
        prev.map(p => p.id === draggedId ? { ...p, statut: dragged.statut } : p)
      )
    })
  }

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUTS.map(({ key, label }) => (
            <KanbanColumn
              key={key}
              statut={key}
              label={label}
              prospects={filteredProspects.filter(p => p.statut === key)}
              onCardClick={setSelectedProspect}
              isDragOver={overStatut === key}
              draggingId={activeProspect?.id ?? null}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          duration: 180,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeProspect && (
            <div className="rotate-2 opacity-95 scale-105 shadow-2xl shadow-black/50">
              <ProspectCard prospect={activeProspect} onClick={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

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
