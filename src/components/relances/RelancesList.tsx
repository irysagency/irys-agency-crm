'use client'

import { useState, useCallback } from 'react'
import { NicheBadge, StatutBadge, NICHE_COLORS } from '@/components/ui/Badge'
import { ProspectDrawer } from '@/components/prospects/ProspectDrawer'
import { daysSince, getInitials } from '@/lib/utils'
import type { Prospect } from '@/types'

interface RelancesListProps {
  initialProspects: Prospect[]
  senders: Record<string, { label: string; email: string | null }>
}

const GROUPS = [
  {
    key: 'critical',
    label: 'Critique',
    sub: 'Plus de 30 jours d\'attente',
    color: 'oklch(0.62 0.18 25)',
    bg: 'oklch(0.97 0.02 25)',
    test: (d: number) => d >= 30,
  },
  {
    key: 'high',
    label: 'À relancer',
    sub: 'Entre 7 et 30 jours',
    color: 'oklch(0.72 0.14 75)',
    bg: 'oklch(0.97 0.03 75)',
    test: (d: number) => d >= 7 && d < 30,
  },
  {
    key: 'normal',
    label: 'Récent',
    sub: 'Moins de 7 jours',
    color: 'oklch(0.62 0.14 155)',
    bg: 'oklch(0.96 0.03 155)',
    test: (d: number) => d < 7,
  },
] as const

export function RelancesList({ initialProspects, senders }: RelancesListProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)

  const handleUpdate = useCallback((updated: Prospect) => {
    setProspects(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedProspect(updated)
  }, [])

  const groups = GROUPS.map(g => ({
    ...g,
    items: prospects.filter(p => g.test(daysSince(p.derniere_action))),
  }))

  return (
    <>
      {/* Top bar */}
      <div className="px-8 py-[18px] border-b border-[#E5E7EB] bg-white flex justify-between items-center flex-shrink-0">
        <div>
          <div className="text-[11px] text-[#8A8F97] font-mono uppercase tracking-[0.08em]">Irys CRM · File d&apos;attente</div>
          <div className="text-[18px] font-semibold tracking-[-0.01em] text-[#111316] mt-0.5 flex items-center gap-2">
            Relances
            <span className="text-[13px] font-normal font-mono text-[#8A8F97]">
              {prospects.length} prospects à relancer
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { window.location.href = '/settings' }}
            className="px-3 py-[8px] bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#474B52] hover:bg-[#F4F5F7] transition-colors"
          >
            ⚙ Délais
          </button>
          <button
            onClick={() => {
              const first = groups[0]?.items[0] ?? prospects[0]
              if (first) setSelectedProspect(first)
            }}
            className="px-[14px] py-[8px] bg-[#111316] text-white border-none rounded-[8px] text-[12px] font-medium hover:bg-[#474B52] transition-colors"
          >
            ⚡ Relancer la sélection
          </button>
        </div>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-auto px-8 py-5">
        {prospects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-[32px] mb-3">✓</div>
            <h3 className="text-[15px] font-semibold text-[#111316]">Aucune relance en attente</h3>
            <p className="text-[13px] text-[#8A8F97] mt-1">Tous vos prospects ont été contactés récemment.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-[22px]">
            {groups.map(g => (
              <div key={g.key}>
                {/* Group header */}
                <div className="flex items-center gap-[10px] mb-[10px]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: g.color }} />
                  <span className="text-[14px] font-semibold text-[#111316]">{g.label}</span>
                  <span className="text-[11px] font-mono text-[#8A8F97]">
                    {g.items.length} · {g.sub}
                  </span>
                  <div className="flex-1 h-px bg-[#E5E7EB] ml-2" />
                </div>

                {/* Group items */}
                {g.items.length === 0 ? (
                  <div className="py-5 text-center text-[12px] italic text-[#8A8F97] bg-white border border-dashed border-[#E5E7EB] rounded-[10px]">
                    Aucune relance dans cette catégorie
                  </div>
                ) : (
                  <div className="grid gap-[10px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {g.items.map(prospect => {
                      const days = daysSince(prospect.derniere_action)
                      const initials = getInitials(prospect.nom)
                      const nicheColor = NICHE_COLORS[prospect.niche] ?? '#8A8F97'
                      const channelLabel =
                        prospect.canal_contact === 'email'     ? 'Email'
                        : prospect.canal_contact === 'instagram' ? 'Instagram'
                        : prospect.canal_contact === 'whatsapp'  ? 'WhatsApp'
                        : prospect.contacte_email               ? 'Email'
                        : prospect.contacte_instagram           ? 'Instagram'
                        : null
                      const channelIcon = channelLabel === 'Email' ? '✉' : channelLabel === 'Instagram' ? '◉' : null

                      return (
                        <div
                          key={prospect.id}
                          className="bg-white border border-[#E5E7EB] rounded-[12px] flex flex-col gap-[10px]"
                          style={{ padding: '14px 16px' }}
                        >
                          {/* Top row: avatar+name+channel | days badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-[10px] min-w-0">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                                style={{
                                  background: `color-mix(in oklch, ${nicheColor} 14%, white)`,
                                  color: `color-mix(in oklch, ${nicheColor} 70%, #000)`,
                                }}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-[#111316] truncate">{prospect.nom}</div>
                                <div className="text-[10px] font-mono text-[#8A8F97] mt-[2px]">
                                  {channelIcon} {channelLabel ?? '—'}
                                </div>
                              </div>
                            </div>
                            <div
                              className="px-2 py-[3px] rounded-[6px] text-right flex-shrink-0"
                              style={{ background: g.bg }}
                            >
                              <div className="text-[14px] font-bold font-mono leading-none" style={{ color: g.color }}>
                                {days}j
                              </div>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex gap-[5px] flex-wrap">
                            <NicheBadge niche={prospect.niche} />
                            <StatutBadge statut={prospect.statut} />
                          </div>

                          {/* Buttons */}
                          <div className="flex gap-[6px]">
                            <button
                              onClick={() => setSelectedProspect(prospect)}
                              className="flex-1 py-[7px] bg-white border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#474B52] hover:bg-[#F4F5F7] transition-colors"
                            >
                              Voir
                            </button>
                            <button
                              onClick={() => setSelectedProspect(prospect)}
                              className="flex-[2] py-[7px] bg-[#111316] text-white border-none rounded-[7px] text-[11px] font-medium hover:bg-[#474B52] transition-colors"
                            >
                              → Relancer
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ProspectDrawer
        prospect={selectedProspect}
        onUpdate={handleUpdate}
        onClose={() => setSelectedProspect(null)}
      />
    </>
  )
}
