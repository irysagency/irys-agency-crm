'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'

interface WeekData {
  semaine: string
  mails: number
}

export function ActivityChart() {
  const [data, setData] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const { data: emails } = await supabase
        .from('emails')
        .select('envoye_le')
        .gte('envoye_le', threeMonthsAgo.toISOString())

      if (emails) {
        const weekMap = new Map<string, number>()
        emails.forEach(email => {
          const date = new Date(email.envoye_le)
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          const key = weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          weekMap.set(key, (weekMap.get(key) ?? 0) + 1)
        })
        setData(Array.from(weekMap.entries()).map(([semaine, mails]) => ({ semaine, mails })))
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-card" />
  }

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-card p-5">
      <h3 className="font-semibold text-text-primary mb-4">Activité d&apos;envoi</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="semaine" tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#F1F1F1' }}
          />
          <Line type="monotone" dataKey="mails" stroke="#7F77DD" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
