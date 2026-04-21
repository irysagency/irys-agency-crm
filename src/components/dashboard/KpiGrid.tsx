'use client'

import { useEffect, useState } from 'react'
import { Users, Eye, MessageSquare, Phone, CheckCircle } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { KpiCardSkeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  personnesContactees: number
  tauxOuverture: number
  tauxReponse: number
  callsBookes: number
  clientsSignes: number
}

export function KpiGrid() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient()

        const { data: prospects } = await supabase.from('prospects').select('statut')

        if (prospects) {
          const contactees = prospects.filter(p => p.statut !== 'a_contacter')
          const ayantOuvert = prospects.filter(p =>
            ['ouvert', 'repondu', 'call_booke', 'signe', 'refuse'].includes(p.statut)
          )
          const ayantRepondu = prospects.filter(p =>
            ['repondu', 'call_booke', 'signe', 'refuse'].includes(p.statut)
          )
          setStats({
            personnesContactees: contactees.length,
            tauxOuverture: contactees.length > 0
              ? Math.round((ayantOuvert.length / contactees.length) * 100)
              : 0,
            tauxReponse: contactees.length > 0
              ? Math.round((ayantRepondu.length / contactees.length) * 100)
              : 0,
            callsBookes: prospects.filter(p => p.statut === 'call_booke').length,
            clientsSignes: prospects.filter(p => p.statut === 'signe').length,
          })
        }
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)}
      </div>
    )
  }

  const s = stats ?? { personnesContactees: 0, tauxOuverture: 0, tauxReponse: 0, callsBookes: 0, clientsSignes: 0 }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <KpiCard label="Personnes contactées" value={s.personnesContactees} icon={<Users className="w-4 h-4 text-accent-violet" />} />
      <KpiCard label="Taux d'ouverture" value={s.tauxOuverture} unit="%" icon={<Eye className="w-4 h-4 text-accent-warning" />} />
      <KpiCard label="Taux de réponse" value={s.tauxReponse} unit="%" icon={<MessageSquare className="w-4 h-4 text-blue-400" />} />
      <KpiCard label="Calls bookés" value={s.callsBookes} icon={<Phone className="w-4 h-4 text-accent-success" />} />
      <KpiCard label="Clients signés" value={s.clientsSignes} icon={<CheckCircle className="w-4 h-4 text-accent-success" />} />
    </div>
  )
}
