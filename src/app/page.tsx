export const dynamic = 'force-dynamic'

import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import {
  getDashboardStats,
  getFunnelData,
  getActivityData,
} from '@/lib/supabase/queries'

export default async function DashboardPage() {
  const [stats, funnel, activity] = await Promise.all([
    getDashboardStats(),
    getFunnelData(),
    getActivityData(30),
  ])

  return (
    <div className="space-y-6">
      <KpiGrid stats={stats} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityChart data={activity} />
        <FunnelChart data={funnel} />
      </div>
    </div>
  )
}
