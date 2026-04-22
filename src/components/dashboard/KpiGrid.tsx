import { Users, Eye, MessageSquare, Phone, CheckCircle } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import type { DashboardStats } from '@/types'

interface KpiGridProps {
  stats: DashboardStats
}

export function KpiGrid({ stats }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <KpiCard label="Personnes contactées" value={stats.personnesContactees} icon={<Users className="w-4 h-4 text-accent-violet" />} />
      <KpiCard label="Taux d'ouverture" value={stats.tauxOuverture} unit="%" icon={<Eye className="w-4 h-4 text-accent-warning" />} />
      <KpiCard label="Taux de réponse" value={stats.tauxReponse} unit="%" icon={<MessageSquare className="w-4 h-4 text-blue-400" />} />
      <KpiCard label="Calls bookés" value={stats.callsBookes} icon={<Phone className="w-4 h-4 text-accent-success" />} />
      <KpiCard label="Clients signés" value={stats.clientsSignes} icon={<CheckCircle className="w-4 h-4 text-accent-success" />} />
    </div>
  )
}
