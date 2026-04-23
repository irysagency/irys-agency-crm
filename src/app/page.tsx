export const dynamic = 'force-dynamic'

import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { NicheStats } from '@/components/dashboard/NicheStats'
import {
  getDashboardStats,
  getFunnelData,
  getActivityData,
  getNicheAndCanalStats,
} from '@/lib/supabase/queries'

import type { DashboardStats, FunnelData } from '@/types'

const EMPTY_STATS: DashboardStats = {
  personnesContactees: 0, mailsEnvoyes: 0, tauxOuverture: 0, tauxReponse: 0,
  callsBookes: 0, clientsSignes: 0, tauxConversionCall: 0, tauxClosing: 0,
  prospectsOuverts: 0, prospectsRepondus: 0, contactesEmail: 0, contactesIG: 0,
}
const EMPTY_FUNNEL: FunnelData = {
  a_contacter: 0, envoye: 0, ouvert: 0, repondu: 0, call_booke: 0, signe: 0, refuse: 0,
}

export default async function DashboardPage() {
  const [stats, funnel, activity, nicheCanal] = await Promise.all([
    getDashboardStats().catch(() => EMPTY_STATS),
    getFunnelData().catch(() => EMPTY_FUNNEL),
    getActivityData(30).catch(() => []),
    getNicheAndCanalStats().catch(() => ({ niches: [], canaux: [] })),
  ])

  return (
    <div className="flex flex-col flex-1">
      {/* Top bar */}
      <div className="px-7 py-[18px] border-b border-[#E5E7EB] bg-white flex justify-between items-center flex-shrink-0">
        <div>
          <div className="text-[11px] text-[#8A8F97] font-mono uppercase tracking-[0.08em]">Irys CRM · Prospection</div>
          <div className="text-[18px] font-semibold tracking-[-0.01em] text-[#111316] mt-0.5">Vue d&apos;ensemble</div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex border border-[#E5E7EB] rounded-[8px] overflow-hidden bg-white">
            {['7j', '14j', '30j', 'Tout'].map((p, i) => (
              <div
                key={p}
                className="px-3 py-[7px] text-[12px] font-mono cursor-pointer"
                style={{
                  background: i === 2 ? '#111316' : 'transparent',
                  color: i === 2 ? '#FFFFFF' : '#474B52',
                  borderRight: i < 3 ? '1px solid #E5E7EB' : 'none',
                }}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-7 flex flex-col gap-3">
        <KpiGrid stats={stats} />
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-3">
          <ActivityChart data={activity} />
          <FunnelChart data={funnel} />
        </div>
        <NicheStats niches={nicheCanal.niches} canaux={nicheCanal.canaux} />
      </div>
    </div>
  )
}
