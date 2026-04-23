'use client'

import { NicheBadge, StatutBadge } from '@/components/ui/Badge'
import { daysSince } from '@/lib/utils'
import type { Prospect } from '@/types'

interface RelanceRowProps {
  prospect: Prospect
  onClick: (prospect: Prospect) => void
  sender?: { label: string; email: string | null } | null
}

function urgency(days: number): 'critical' | 'high' | 'normal' {
  if (days >= 30) return 'critical'
  if (days >= 10) return 'high'
  return 'normal'
}

const URGENCY_COLOR = {
  critical: 'oklch(0.62 0.18 25)',
  high:     'oklch(0.72 0.14 75)',
  normal:   'oklch(0.62 0.14 155)',
}

export function RelanceRow({ prospect, onClick, sender }: RelanceRowProps) {
  const days = daysSince(prospect.derniere_action)
  const u = urgency(days)
  const color = URGENCY_COLOR[u]
  const contactedDate = prospect.derniere_action
    ? new Date(prospect.derniere_action).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'

  const channelLabel = prospect.canal_contact === 'email' ? 'Email'
    : prospect.canal_contact === 'instagram' ? 'Instagram'
    : prospect.canal_contact === 'whatsapp' ? 'WhatsApp'
    : prospect.contacte_email ? 'Email'
    : prospect.contacte_instagram ? 'Instagram'
    : null

  const channelIcon = channelLabel === 'Email' ? '✉' : channelLabel === 'Instagram' ? '◉' : channelLabel === 'WhatsApp' ? '💬' : null

  return (
    <button
      onClick={() => onClick(prospect)}
      className="w-full text-left bg-white border border-[#E5E7EB] rounded-[10px] flex items-center gap-4 px-[18px] py-[14px] hover:border-[#D6D9DE] hover:shadow-sm transition-all group"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* Days counter */}
      <div className="w-[60px] text-center flex-shrink-0">
        <div className="text-[22px] font-bold font-mono leading-none" style={{ color }}>
          {days}<span className="text-[12px] font-medium">j</span>
        </div>
        <div className="text-[9px] font-mono text-[#8A8F97] uppercase tracking-[0.08em] mt-1">d&apos;attente</div>
      </div>

      {/* Divider */}
      <div className="w-px h-[34px] bg-[#E5E7EB] flex-shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#111316] group-hover:text-[oklch(0.38_0.10_155)] transition-colors truncate">{prospect.nom}</span>
          {channelLabel && channelIcon && (
            <span className="text-[10px] font-mono text-[#8A8F97] flex-shrink-0">
              · {channelIcon} {channelLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <NicheBadge niche={prospect.niche} />
          <StatutBadge statut={prospect.statut} />
          <span className="text-[11px] font-mono text-[#8A8F97]">· contacté le {contactedDate}</span>
          {sender && (
            <span className="text-[10px] font-mono text-[#8A8F97] bg-[#F4F5F7] px-1.5 py-0.5 rounded-[4px]">
              via {sender.label}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0">
        <span className="px-[11px] py-[7px] bg-white border border-[#E5E7EB] rounded-[7px] text-[11px] font-medium text-[#474B52] cursor-pointer">
          Reporter
        </span>
        <span
          className="px-[12px] py-[7px] rounded-[7px] text-[11px] font-medium text-white cursor-pointer"
          style={{ background: '#111316' }}
        >
          → Relancer
        </span>
      </div>
    </button>
  )
}
