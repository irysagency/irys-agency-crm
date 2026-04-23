import type { NicheType, StatutType } from '@/types'

const NICHE_COLORS: Record<string, string> = {
  'Tech & IA':                    'oklch(0.58 0.14 245)',
  'Creator Economy':              'oklch(0.64 0.18 340)',
  'Entrepreneur':                 'oklch(0.64 0.16 35)',
  'Marketing & Vente':            'oklch(0.62 0.14 155)',
  'Finance & Wealth':             'oklch(0.62 0.14 210)',
  'Ecommerce':                    'oklch(0.58 0.16 295)',
  'Make Money & Trends':          'oklch(0.62 0.14 100)',
  'Productivité & Second Brain':  'oklch(0.58 0.14 180)',
}

interface StatusColors { fg: string; bg: string; dot: string }
const STATUT_COLORS: Record<StatutType, StatusColors> = {
  a_contacter: { fg: '#474B52',                  bg: '#E5E7EB',                dot: '#8A8F97' },
  envoye:      { fg: '#1E3A8A',                  bg: 'oklch(0.95 0.04 245)',   dot: 'oklch(0.58 0.14 245)' },
  ouvert:      { fg: 'oklch(0.38 0.12 75)',       bg: 'oklch(0.96 0.04 75)',    dot: 'oklch(0.72 0.14 75)' },
  repondu:     { fg: 'oklch(0.30 0.15 295)',      bg: 'oklch(0.96 0.04 295)',   dot: 'oklch(0.58 0.16 295)' },
  call_booke:  { fg: 'oklch(0.30 0.14 340)',      bg: 'oklch(0.96 0.04 340)',   dot: 'oklch(0.64 0.18 340)' },
  signe:       { fg: 'oklch(0.32 0.14 155)',      bg: 'oklch(0.95 0.04 155)',   dot: 'oklch(0.62 0.14 155)' },
  refuse:      { fg: '#6B2E2E',                  bg: 'oklch(0.96 0.02 25)',    dot: 'oklch(0.62 0.18 25)' },
}

const STATUT_LABELS: Record<StatutType, string> = {
  a_contacter: 'À contacter',
  envoye:      'Envoyé',
  ouvert:      'Ouvert',
  repondu:     'Répondu',
  call_booke:  'Call booké',
  signe:       'Signé',
  refuse:      'Refusé',
}

interface StatutBadgeProps { statut: StatutType; className?: string }

export function StatutBadge({ statut, className }: StatutBadgeProps) {
  const sc = STATUT_COLORS[statut] ?? { fg: '#474B52', bg: '#E5E7EB', dot: '#8A8F97' }
  return (
    <span
      className={['inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-full text-[11px] font-medium whitespace-nowrap', className].filter(Boolean).join(' ')}
      style={{ background: sc.bg, color: sc.fg }}
    >
      <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: sc.dot }} />
      {STATUT_LABELS[statut]}
    </span>
  )
}

interface NicheBadgeProps { niche: NicheType; className?: string }

export function NicheBadge({ niche, className }: NicheBadgeProps) {
  const color = NICHE_COLORS[niche] ?? '#8A8F97'
  return (
    <span
      className={['inline-flex items-center px-2 py-[3px] rounded-[6px] text-[11px] font-medium whitespace-nowrap', className].filter(Boolean).join(' ')}
      style={{
        background: `color-mix(in oklch, ${color} 10%, white)`,
        color: `color-mix(in oklch, ${color} 75%, #000)`,
        border: `1px solid color-mix(in oklch, ${color} 20%, white)`,
      }}
    >
      {niche}
    </span>
  )
}

export { NICHE_COLORS }
