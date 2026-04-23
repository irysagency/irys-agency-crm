'use client'

import { useState, useCallback } from 'react'
import { CheckSquare, X, Loader2 } from 'lucide-react'
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
import { ProspectDrawer } from './ProspectDrawer'
import { AddProspectModal } from './AddProspectModal'
import { ProspectsTable } from './ProspectsTable'
import type { Prospect, NicheType, StatutType } from '@/types'
import { STATUTS, NICHES } from '@/types'

interface KanbanBoardProps {
  initialProspects: Prospect[]
}

export function KanbanBoard({ initialProspects }: KanbanBoardProps) {
  const [prospects, setProspects]               = useState<Prospect[]>(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [nicheFilter, setNicheFilter]           = useState<NicheType | null>(null)
  const [showAddModal, setShowAddModal]         = useState(false)
  const [activeProspect, setActiveProspect]     = useState<Prospect | null>(null)
  const [overStatut, setOverStatut]             = useState<StatutType | null>(null)

  // --- Bulk selection ---
  const [view, setView] = useState<'kanban' | 'tableau'>('kanban')

  // --- Bulk selection ---
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)

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
    const isColumn = STATUTS.some(s => s.key === overId)
    const targetStatut: StatutType = isColumn
      ? (overId as StatutType)
      : (prospects.find(p => p.id === overId)?.statut ?? null)!

    const dragged = prospects.find(p => p.id === draggedId)
    if (!dragged || dragged.statut === targetStatut) return

    setProspects(prev =>
      prev.map(p => p.id === draggedId ? { ...p, statut: targetStatut } : p)
    )
    fetch(`/api/prospects/${draggedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: targetStatut }),
    }).catch(() => {
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

  function toggleSelectMode() {
    setSelectMode(v => !v)
    setSelectedIds(new Set())
  }

  function handleSelect(id: string, selected: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleSelectAll() {
    const allVisible = filteredProspects.map(p => p.id)
    const allAreSelected = allVisible.length > 0 && allVisible.every(id => selectedIds.has(id))
    setSelectedIds(allAreSelected ? new Set() : new Set(allVisible))
  }

  async function handleBulkStatut(statut: StatutType) {
    if (selectedIds.size === 0) return
    setBulkSaving(true)
    const ids = [...selectedIds]
    const snapshot = prospects
    setProspects(prev =>
      prev.map(p => ids.includes(p.id) ? { ...p, statut } : p)
    )
    try {
      const res = await fetch('/api/prospects/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, statut }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setProspects(snapshot)
    } finally {
      setBulkSaving(false)
      setSelectedIds(new Set())
      setSelectMode(false)
    }
  }

  const allVisibleSelected = filteredProspects.length > 0 &&
    filteredProspects.every(p => selectedIds.has(p.id))

  return (
    <div className="flex flex-col flex-1">

      {/* Top bar */}
      <div className="px-7 py-[18px] border-b border-[#E5E7EB] bg-white flex justify-between items-center flex-shrink-0">
        <div>
          <div className="text-[11px] text-[#8A8F97] font-mono uppercase tracking-[0.08em]">Irys CRM · Pipeline</div>
          <div className="text-[18px] font-semibold tracking-[-0.01em] text-[#111316] mt-0.5">
            Prospects{' '}
            <span className="text-[#8A8F97] font-normal font-mono text-[13px] ml-1.5">{filteredProspects.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === 'kanban' && (
            <button
              onClick={toggleSelectMode}
              className={[
                'flex items-center gap-2 px-3 py-[7px] rounded-[8px] text-[12px] font-medium transition-colors border',
                selectMode
                  ? 'bg-[oklch(0.95_0.04_155)] text-[oklch(0.62_0.14_155)] border-[oklch(0.62_0.14_155)]'
                  : 'bg-white text-[#474B52] border-[#E5E7EB] hover:bg-[#F4F5F7]',
              ].join(' ')}
            >
              <CheckSquare className="w-4 h-4" />
              {selectMode ? 'Annuler' : 'Sélection'}
            </button>
          )}
          <div className="flex border border-[#E5E7EB] rounded-[8px] overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className="px-[10px] py-[7px] text-[11px] font-mono transition-colors"
              style={{
                background: view === 'kanban' ? '#111316' : 'transparent',
                color: view === 'kanban' ? '#FFFFFF' : '#8A8F97',
              }}
            >
              ◳ Kanban
            </button>
            <button
              onClick={() => setView('tableau')}
              className="px-[10px] py-[7px] text-[11px] font-mono transition-colors border-l border-[#E5E7EB]"
              style={{
                background: view === 'tableau' ? '#111316' : 'transparent',
                color: view === 'tableau' ? '#FFFFFF' : '#8A8F97',
              }}
            >
              ▤ Tableau
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-[7px] bg-[#111316] text-white border-none rounded-[8px] text-[12px] font-medium cursor-pointer hover:bg-[#474B52] transition-colors"
          >
            + Nouveau
          </button>
        </div>
      </div>

      {/* Niche filter bar — kanban only */}
      {view === 'kanban' && (
        <div className="px-7 py-3 border-b border-[#E5E7EB] bg-white flex gap-1.5 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setNicheFilter(null)}
            className={[
              'px-[11px] py-[6px] text-[12px] rounded-[7px] border whitespace-nowrap transition-colors',
              nicheFilter === null
                ? 'bg-[#111316] text-white border-[#111316] font-medium'
                : 'bg-[#F4F5F7] text-[#474B52] border-transparent hover:bg-[#E5E7EB]',
            ].join(' ')}
          >
            Tous
          </button>
          {NICHES.map(niche => (
            <button
              key={niche}
              onClick={() => setNicheFilter(nicheFilter === niche ? null : niche)}
              className={[
                'px-[11px] py-[6px] text-[12px] rounded-[7px] border whitespace-nowrap transition-colors',
                nicheFilter === niche
                  ? 'bg-[#111316] text-white border-[#111316] font-medium'
                  : 'bg-[#F4F5F7] text-[#474B52] border-transparent hover:bg-[#E5E7EB]',
              ].join(' ')}
            >
              {niche}
            </button>
          ))}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="flex flex-1 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-2.5 p-4 overflow-x-auto flex-1">
              {STATUTS.map(({ key, label }) => (
                <KanbanColumn
                  key={key}
                  statut={key}
                  label={label}
                  prospects={filteredProspects.filter(p => p.statut === key)}
                  onCardClick={selectMode ? () => {} : setSelectedProspect}
                  isDragOver={overStatut === key}
                  draggingId={activeProspect?.id ?? null}
                  selectedIds={selectMode ? selectedIds : undefined}
                  onSelect={selectMode ? handleSelect : undefined}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
              {activeProspect && (
                <div className="rotate-2 opacity-95 scale-105 shadow-lg">
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
        </div>
      )}

      {/* Table view */}
      {view === 'tableau' && (
        <ProspectsTable initialProspects={prospects} />
      )}

      {/* Bulk action bar */}
      {selectMode && view === 'kanban' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-[16px] px-4 py-3 shadow-lg shadow-black/10">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-[12px] text-[#8A8F97] hover:text-[#111316] transition-colors underline-offset-2 hover:underline"
              >
                {allVisibleSelected ? 'Tout désélectionner' : `Tout sélectionner (${filteredProspects.length})`}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-[11px] font-semibold text-white bg-[oklch(0.62_0.14_155)] px-2 py-0.5 rounded-full font-mono">
                  {selectedIds.size}
                </span>
              )}
            </div>
            <div className="w-px h-5 bg-[#E5E7EB]" />
            <span className="text-[10px] text-[#8A8F97] uppercase tracking-wider font-mono">Changer statut →</span>
            <div className="flex items-center gap-1.5">
              {STATUTS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => void handleBulkStatut(key)}
                  disabled={bulkSaving || selectedIds.size === 0}
                  className="px-2.5 py-1 rounded-[7px] text-[11px] font-medium bg-[#F4F5F7] text-[#474B52] hover:bg-[#E5E7EB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-[#E5E7EB]" />
            {bulkSaving
              ? <Loader2 className="w-4 h-4 animate-spin text-[#8A8F97]" />
              : (
                <button
                  onClick={toggleSelectMode}
                  className="p-1.5 rounded-[7px] text-[#8A8F97] hover:text-[#111316] hover:bg-[#F4F5F7] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )
            }
          </div>
        </div>
      )}

      <AddProspectModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleProspectCreated}
      />
    </div>
  )
}
