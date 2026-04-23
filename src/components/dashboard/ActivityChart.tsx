'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ActivityPoint } from '@/types'

interface ActivityChartProps { data: ActivityPoint[] }

export function ActivityChart({ data }: ActivityChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  }))

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[16px_20px]">
      <div className="flex justify-between items-center mb-1.5">
        <div>
          <h3 className="text-[13px] font-semibold text-[#111316]">Activité d&apos;envoi</h3>
          <p className="text-[11px] text-[#8A8F97] mt-0.5">Envois quotidiens vs ouvertures · 30 jours</p>
        </div>
        <div className="flex gap-2.5 text-[11px] font-mono text-[#8A8F97]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-[2px] bg-[#111316] rounded" /> Envoyés
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-[2px] rounded" style={{ background: 'oklch(0.62 0.14 155)' }} /> Ouvertures
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#8A8F97', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8A8F97', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              color: '#111316',
              fontSize: 12,
            }}
          />
          <Bar dataKey="emailsEnvoyes" name="Envoyés" fill="#111316" radius={[2, 2, 0, 0]} opacity={0.85} />
          <Line
            type="monotone"
            dataKey="ouvertures"
            name="Ouvertures"
            stroke="oklch(0.62 0.14 155)"
            strokeWidth={1.8}
            dot={{ fill: '#FFFFFF', stroke: 'oklch(0.62 0.14 155)', strokeWidth: 1.5, r: 2.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
