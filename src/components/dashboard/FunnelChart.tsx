import type { FunnelData } from '@/types'
import { STATUTS } from '@/types'

interface FunnelChartProps { data: FunnelData }

export function FunnelChart({ data }: FunnelChartProps) {
  const rows = STATUTS.map(s => ({ key: s.key, label: s.label, count: data[s.key] }))
  const maxCount = Math.max(...rows.map(r => r.count), 1)

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[16px_20px]">
      <h3 className="text-[13px] font-semibold text-[#111316]">Entonnoir de conversion</h3>
      <p className="text-[11px] text-[#8A8F97] mt-0.5 mb-[14px]">Distribution actuelle des prospects</p>
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => {
          const pct = rows[0].count > 0 && i > 0
            ? Math.round((r.count / rows[0].count) * 100)
            : 0
          const isSigne = r.key === 'signe'
          return (
            <div key={r.key}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#474B52]">{r.label}</span>
                <span className="font-mono text-[#111316]">
                  {r.count}
                  {i > 0 && r.count > 0 && (
                    <span className="text-[#8A8F97] ml-1.5">· {pct}%</span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-[4px] overflow-hidden">
                <div
                  className="h-full rounded-[4px] transition-all duration-500"
                  style={{
                    width: `${maxCount > 0 ? Math.max((r.count / maxCount) * 100, r.count > 0 ? 2 : 0) : 0}%`,
                    background: isSigne ? 'oklch(0.62 0.14 155)' : '#111316',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
