'use client'

import { useEffect, useState } from 'react'
import { Mail, Eye, MessageSquare, Phone, CheckCircle } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { KpiCardSkeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  mailsEnvoyesSemaine: number
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
      const supabase = createClient()
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const [emailsRes, prospectsRes] = await Promise.all([
        supabase.from('emails').select('ouvert').gte('envoye_le', oneWeekAgo.toISOString()),
        supabase.from('prospects').select('statut'),
      ])

      if (emailsRes.data && prospectsRes.data) {
        const emails = emailsRes.data
        const prospects = prospectsRes.data
        setStats({
          mailsEnvoyesSemaine: emails.length,
          tauxOuverture: emails.length > 0
            ? Math.round((emails.filter(e => e.ouvert).length / emails.length) * 100)
            : 0,
          tauxReponse: prospects.length > 0
            ? Math.round((prospects.filter(p => (['repondu', 'call_booke', 'signe'] as const).includes(p.statut as 'repondu' | 'call_booke' | 'signe')).length / prospects.length) * 100)
            : 0,
          callsBookes: prospects.filter(p => p.statut === 'call_booke').length,
          clientsSignes: prospects.filter(p => p.statut === 'signe').length,
        })
      }
      setLoading(false)
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

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <KpiCard label="Mails envoyés" value={stats.mailsEnvoyesSemaine} icon={<Mail className="w-4 h-4 text-accent-violet" />} />
      <KpiCard label="Taux d'ouverture" value={stats.tauxOuverture} unit="%" icon={<Eye className="w-4 h-4 text-accent-warning" />} />
      <KpiCard label="Taux de réponse" value={stats.tauxReponse} unit="%" icon={<MessageSquare className="w-4 h-4 text-blue-400" />} />
      <KpiCard label="Calls bookés" value={stats.callsBookes} icon={<Phone className="w-4 h-4 text-accent-success" />} />
      <KpiCard label="Clients signés" value={stats.clientsSignes} icon={<CheckCircle className="w-4 h-4 text-accent-success" />} />
    </div>
  )
}
