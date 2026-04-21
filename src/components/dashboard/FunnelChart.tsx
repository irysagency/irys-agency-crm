'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'

interface WeekFunnel {
  semaine: string
  envoye: number
  repondu: number
  converti: number
}

export function FunnelChart() {
  const [data, setData] = useState<WeekFunnel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const twoMonthsAgo = new Date()
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

        const { data: prospects } = await supabase
          .from('prospects')
          .select('statut, derniere_action')
          .gte('derniere_action', twoMonthsAgo.toISOString())

        if (prospects) {
          const weekMap = new Map<string, WeekFunnel>()
          prospects.forEach(prospect => {
            if (!prospect.derniere_action) return
            const date = new Date(prospect.derniere_action)
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            const key = weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
            const existing = weekMap.get(key) ?? { semaine: key, envoye: 0, repondu: 0, converti: 0 }
            existing.envoye++
            if ((['repondu', 'call_booke', 'signe'] as const).includes(prospect.statut as 'repondu' | 'call_booke' | 'signe')) existing.repondu++
            if ((['call_booke', 'signe'] as const).includes(prospect.statut as 'call_booke' | 'signe')) existing.converti++
            weekMap.set(key, existing)
          })
          setData(Array.from(weekMap.values()))
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-card" />
  }

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-card p-5">
      <h3 className="font-semibold text-text-primary mb-4">Funnel prospects</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="semaine" tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#F1F1F1' }} />
          <Legend wrapperStyle={{ color: '#888780', fontSize: '12px' }} />
          <Bar dataKey="envoye" name="Envoyé" fill="#7F77DD" radius={[4, 4, 0, 0]} />
          <Bar dataKey="repondu" name="Répondu" fill="#1D9E75" radius={[4, 4, 0, 0]} />
          <Bar dataKey="converti" name="Converti" fill="#EF9F27" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
