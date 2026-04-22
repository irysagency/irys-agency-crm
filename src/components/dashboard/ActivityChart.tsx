'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ActivityPoint } from '@/types'

interface ActivityChartProps {
  data: ActivityPoint[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-card p-5">
      <h3 className="font-semibold text-text-primary mb-4">Activité d&apos;envoi</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#F1F1F1' }} />
          <Legend wrapperStyle={{ color: '#888780', fontSize: '12px' }} />
          <Line type="monotone" dataKey="emailsEnvoyes" name="Envoyés" stroke="#7F77DD" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ouvertures" name="Ouvertures" stroke="#EF9F27" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
