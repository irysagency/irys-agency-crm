import { KpiCard } from '@/components/ui/KpiCard'
import type { DashboardStats } from '@/types'

interface KpiGridProps { stats: DashboardStats }

export function KpiGrid({ stats }: KpiGridProps) {
  const kpis = [
    {
      label: 'Contactés',
      value: stats.personnesContactees,
      sub: `${stats.contactesEmail} email · ${stats.contactesIG} Instagram`,
      delta: undefined,
      tone: 'neutral' as const,
      spark: [4, 6, 5, 8, 7, 9, stats.personnesContactees],
    },
    {
      label: 'Ont ouvert',
      value: stats.tauxOuverture,
      unit: '%',
      sub: `${stats.prospectsOuverts} / ${stats.contactesEmail} emails`,
      tone: 'good' as const,
      spark: [20, 30, 40, 45, 50, 54, stats.tauxOuverture],
    },
    {
      label: 'Taux réponse',
      value: stats.tauxReponse,
      unit: '%',
      sub: `${stats.prospectsRepondus} / ${stats.personnesContactees} contactés`,
      tone: 'good' as const,
      spark: [10, 12, 14, 14, 15, 17, stats.tauxReponse],
    },
    {
      label: 'Calls bookés',
      value: stats.callsBookes,
      sub: `${stats.tauxConversionCall}% de conversion`,
      tone: 'warn' as const,
      spark: [0, 0, 0, 0, 0, 1, stats.callsBookes],
    },
    {
      label: 'Clients signés',
      value: stats.clientsSignes,
      sub: stats.callsBookes + stats.clientsSignes > 0
        ? `${stats.tauxClosing}% de closing`
        : 'Premier à venir',
      tone: 'accent' as const,
      spark: [1, 1, 2, 2, 2, 3, stats.clientsSignes],
    },
  ]

  return (
    <div className="grid grid-cols-5 border border-[#E5E7EB] rounded-[12px] bg-white overflow-hidden">
      {kpis.map((k, i) => (
        <div
          key={k.label}
          className={i > 0 ? 'border-l border-[#E5E7EB]' : ''}
        >
          <KpiCard {...k} />
        </div>
      ))}
    </div>
  )
}
