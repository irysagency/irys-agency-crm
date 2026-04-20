import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { ActivityChart } from '@/components/dashboard/ActivityChart'
import { FunnelChart } from '@/components/dashboard/FunnelChart'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <KpiGrid />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityChart />
        <FunnelChart />
      </div>
    </div>
  )
}
