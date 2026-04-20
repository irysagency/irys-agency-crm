import { clsx } from 'clsx'
import type { NicheType, StatutType } from '@/types'

const STATUT_STYLES: Record<StatutType, string> = {
  a_contacter: 'bg-text-secondary/10 text-text-secondary',
  envoye: 'bg-accent-violet/15 text-accent-violet',
  ouvert: 'bg-accent-warning/15 text-accent-warning',
  repondu: 'bg-blue-500/15 text-blue-400',
  call_booke: 'bg-accent-success/15 text-accent-success',
  signe: 'bg-accent-success/25 text-accent-success',
  refuse: 'bg-accent-danger/15 text-accent-danger',
}

const STATUT_LABELS: Record<StatutType, string> = {
  a_contacter: 'À contacter',
  envoye: 'Envoyé',
  ouvert: 'Ouvert',
  repondu: 'Répondu',
  call_booke: 'Call booké',
  signe: 'Signé',
  refuse: 'Refusé',
}

interface StatutBadgeProps {
  statut: StatutType
  className?: string
}

export function StatutBadge({ statut, className }: StatutBadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-badge text-xs font-medium',
      STATUT_STYLES[statut],
      className
    )}>
      {STATUT_LABELS[statut]}
    </span>
  )
}

interface NicheBadgeProps {
  niche: NicheType
  className?: string
}

export function NicheBadge({ niche, className }: NicheBadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-badge text-xs font-medium bg-white/5 text-text-secondary',
      className
    )}>
      {niche}
    </span>
  )
}
