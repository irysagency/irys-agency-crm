'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { FunnelData } from '@/types'
import { STATUTS } from '@/types'

interface FunnelChartProps {
  data: FunnelData
}

export function FunnelChart({ data }: FunnelChartProps) {
  const chartData = STATUTS.map(s => ({ statut: s.label, count: data[s.key] }))

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-card p-5">
      <h3 className="font-semibold text-text-primary mb-4">Funnel prospects</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="statut" tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#888780', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#13131F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#F1F1F1' }} />
          <Legend wrapperStyle={{ color: '#888780', fontSize: '12px' }} />
          <Bar dataKey="count" name="Prospects" fill="#7F77DD" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
