'use client'

import { useState, useMemo, useCallback } from 'react'
import { NicheBadge, StatutBadge, NICHE_COLORS } from '@/components/ui/Badge'
import { ProspectDrawer } from './ProspectDrawer'
import { getInitials } from '@/lib/utils'
import type { Prospect, NicheType, StatutType } from '@/types'
import { NICHES, STATUTS } from '@/types'

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days}j`
  if (days < 365) return `il y a ${Math.floor(days / 30)}mo`
  return `il y a ${Math.floor(days / 365)}an`
}

interface ProspectsTableProps {
  initialProspects: Prospect[]
}

export function ProspectsTable({ initialProspects }: ProspectsTableProps) {
  const [prospects, setProspects]           = useState<Prospect[]>(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [activeNiche, setActiveNiche]       = useState<NicheType | null>(null)
  const [activeStatus, setActiveStatus]     = useState<StatutType | ''>('')
  const [search, setSearch]                 = useState('')

  const filtered = useMemo(() => {
    let list = prospects
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.nom.toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        (p.instagram ?? '').toLowerCase().includes(q)
      )
    }
    if (activeNiche)  list = list.filter(p => p.niche === activeNiche)
    if (activeStatus) list = list.filter(p => p.statut === activeStatus)
    return list
  }, [prospects, search, activeNiche, activeStatus])

  const handleUpdate = useCallback((updated: Prospect) => {
    setProspects(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedProspect(updated)
  }, [])

  return (
    <>
      {/* Filter bar */}
      <div className="px-7 py-3 border-b border-[#E5E7EB] bg-white flex gap-3 items-center overflow-x-auto flex-shrink-0">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="px-[10px] py-[6px] text-[12px] border border-[#E5E7EB] rounded-[6px] bg-[#F4F5F7] text-[#111316] placeholder:text-[#8A8F97] outline-none focus:border-[oklch(0.62_0.14_155)] transition-colors w-[180px] flex-shrink-0"
        />
        <div className="w-px h-5 bg-[#E5E7EB] flex-shrink-0" />
        <div className="flex gap-[5px] flex-wrap">
          <button
            onClick={() => setActiveNiche(null)}
            className="px-[10px] py-[5px] text-[11px] rounded-[6px] transition-colors whitespace-nowrap"
            style={{
              background: activeNiche === null ? '#111316' : '#F4F5F7',
              color: activeNiche === null ? '#FFFFFF' : '#474B52',
            }}
          >
            Tous
          </button>
          {NICHES.map(n => (
            <button
              key={n}
              onClick={() => setActiveNiche(activeNiche === n ? null : n)}
              className="px-[10px] py-[5px] text-[11px] rounded-[6px] transition-colors whitespace-nowrap"
              style={{
                background: activeNiche === n ? '#111316' : '#F4F5F7',
                color: activeNiche === n ? '#FFFFFF' : '#474B52',
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-[#E5E7EB] flex-shrink-0" />
        <select
          value={activeStatus}
          onChange={e => setActiveStatus(e.target.value as StatutType | '')}
          className="px-[10px] py-[6px] text-[11px] font-mono border border-[#E5E7EB] rounded-[6px] bg-white text-[#474B52] outline-none flex-shrink-0"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table + Drawer */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto min-w-0">
          {/* Sticky header */}
          <div
            className="grid px-6 py-[10px] text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.08em] border-b border-[#E5E7EB] bg-white sticky top-0 z-10"
            style={{ gridTemplateColumns: '28px 1.4fr 1fr 0.9fr 0.8fr 0.9fr 36px' }}
          >
            <div><input type="checkbox" className="w-3.5 h-3.5 accent-[#111316]" /></div>
            <div>Prospect</div>
            <div>Niche</div>
            <div>Statut</div>
            <div>Canal</div>
            <div>Dernière activité</div>
            <div />
          </div>

          {/* Rows */}
          {filtered.map((p, i) => {
            const active = selectedProspect?.id === p.id
            const initials = getInitials(p.nom)
            const nicheColor = NICHE_COLORS[p.niche] ?? '#8A8F97'
            const handle = p.instagram ?? p.email ?? null
            const channelLabel =
              p.canal_contact === 'email'     ? 'Email'
              : p.canal_contact === 'instagram' ? 'Instagram'
              : p.canal_contact === 'whatsapp'  ? 'WhatsApp'
              : p.contacte_email               ? 'Email'
              : p.contacte_instagram           ? 'Instagram'
              : null
            const channelIcon =
              channelLabel === 'Email'     ? '✉'
              : channelLabel === 'Instagram' ? '◉'
              : null

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProspect(p)}
                className="grid px-6 py-[11px] items-center border-b border-[#E5E7EB] cursor-pointer hover:brightness-[0.98] transition-[filter]"
                style={{
                  gridTemplateColumns: '28px 1.4fr 1fr 0.9fr 0.8fr 0.9fr 36px',
                  background: active
                    ? 'oklch(0.95 0.04 155)'
                    : i % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
                }}
              >
                <div onClick={e => e.stopPropagation()}>
                  <input type="checkbox" className="w-3.5 h-3.5 accent-[#111316]" />
                </div>
                <div className="flex items-center gap-[9px] min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                    style={{
                      background: `color-mix(in oklch, ${nicheColor} 14%, white)`,
                      color: `color-mix(in oklch, ${nicheColor} 70%, #000)`,
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#111316] truncate">{p.nom}</div>
                    {handle && (
                      <div className="text-[10px] font-mono text-[#8A8F97] truncate">{handle}</div>
                    )}
                  </div>
                </div>
                <div><NicheBadge niche={p.niche} /></div>
                <div><StatutBadge statut={p.statut} /></div>
                <div className="text-[12px] text-[#474B52] flex items-center gap-[5px]">
                  {channelIcon && <span>{channelIcon}</span>}
                  <span>{channelLabel ?? '—'}</span>
                </div>
                <div className="text-[11px] font-mono text-[#8A8F97]">◷ {relativeTime(p.derniere_action)}</div>
                <div className="text-[#8A8F97] text-[14px]">›</div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-[13px] text-[#8A8F97]">Aucun prospect trouvé</div>
            </div>
          )}
        </div>

        <ProspectDrawer
          prospect={selectedProspect}
          onUpdate={handleUpdate}
          onClose={() => setSelectedProspect(null)}
        />
      </div>
    </>
  )
}
