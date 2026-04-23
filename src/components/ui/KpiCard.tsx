'use client'

interface SparkProps { data: number[]; color: string }

function Spark({ data, color }: SparkProps) {
  const w = 72, h = 24
  const mx = Math.max(...data, 1)
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / mx) * (h - 2) - 1}`)
    .join(' ')
  return (
    <svg width={w} height={h} style={{ display: 'block', flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export type KpiTone = 'good' | 'warn' | 'accent' | 'neutral'

interface KpiCardProps {
  label: string
  value: string | number
  unit?: string
  sub?: string
  delta?: string
  tone?: KpiTone
  spark?: number[]
}

export function KpiCard({ label, value, unit, sub, delta, tone = 'neutral', spark }: KpiCardProps) {
  const color =
    tone === 'good' || tone === 'accent' ? 'oklch(0.62 0.14 155)'
    : tone === 'warn' ? 'oklch(0.72 0.14 75)'
    : '#474B52'

  return (
    <div className="px-[18px] py-[16px]">
      <div className="flex justify-between items-start">
        <p className="text-[10px] text-[#8A8F97] uppercase tracking-[0.1em] font-mono">{label}</p>
        {delta && (
          <span
            className="text-[10px] font-mono px-[6px] py-[2px] rounded-[4px]"
            style={{ color, background: `color-mix(in oklch, ${color} 12%, white)` }}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between mt-[14px]">
        <div className="flex items-baseline gap-[2px]">
          <span className="text-[32px] font-semibold tracking-[-0.03em] leading-none text-[#111316]">{value}</span>
          {unit && <span className="text-base font-medium text-[#474B52]">{unit}</span>}
        </div>
        {spark && <Spark data={spark} color={color} />}
      </div>
      {sub && <p className="text-[10px] text-[#8A8F97] font-mono mt-2">{sub}</p>}
    </div>
  )
}
