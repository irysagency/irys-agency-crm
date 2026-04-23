import type { NicheStat, CanalStat } from '@/lib/supabase/queries'

const NICHE_COLORS: Record<string, string> = {
  'Tech & IA':                   'oklch(0.58 0.14 245)',
  'Creator Economy':             'oklch(0.64 0.18 340)',
  'Entrepreneur':                'oklch(0.64 0.16 35)',
  'Marketing & Vente':           'oklch(0.62 0.14 155)',
  'Finance & Wealth':            'oklch(0.62 0.14 210)',
  'Ecommerce':                   'oklch(0.58 0.16 295)',
  'Make Money & Trends':         'oklch(0.62 0.14 100)',
  'Productivité & Second Brain': 'oklch(0.58 0.14 180)',
}

interface NicheStatsProps {
  niches: NicheStat[]
  canaux: CanalStat[]
}

export function NicheStats({ niches, canaux }: NicheStatsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">

      {/* Par niche — table layout */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[16px_20px]">
        <div className="mb-2.5">
          <h3 className="text-[13px] font-semibold text-[#111316]">Stats par niche</h3>
          <p className="text-[11px] text-[#8A8F97] mt-0.5">Performance par segment · trié par volume</p>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1.3fr_0.7fr_1.4fr_0.7fr] py-2 border-b border-[#E5E7EB] text-[10px] text-[#8A8F97] font-mono uppercase tracking-[0.08em]">
          <div>Niche</div>
          <div className="text-right">Prospects</div>
          <div>Taux réponse</div>
          <div className="text-right">Signés</div>
        </div>

        {niches.length === 0 && (
          <p className="text-[12px] text-[#8A8F97] text-center py-6 italic">Aucune donnée</p>
        )}

        {niches.map((n, i) => {
          const color = NICHE_COLORS[n.niche] ?? '#8A8F97'
          const responseRate = n.contactes > 0 ? Math.round((n.reponses / n.contactes) * 100) : 0
          return (
            <div
              key={n.niche}
              className="grid grid-cols-[1.3fr_0.7fr_1.4fr_0.7fr] py-2.5 items-center text-[12.5px]"
              style={{ borderBottom: i < niches.length - 1 ? '1px solid #E5E7EB' : 'none' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-4 rounded-[2px] flex-shrink-0" style={{ background: color }} />
                <span className="text-[#111316] truncate">{n.niche}</span>
              </div>
              <div className="text-right font-mono text-[#474B52]">{n.total}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 max-w-[120px] h-1 bg-[#E5E7EB] rounded-[2px] overflow-hidden">
                  <div
                    className="h-full rounded-[2px]"
                    style={{ width: `${Math.min(responseRate, 100)}%`, background: color }}
                  />
                </div>
                <span className="text-[11px] font-mono text-[#474B52] w-[34px]">{responseRate}%</span>
              </div>
              <div
                className="text-right font-mono text-[12px]"
                style={{
                  color: n.signes > 0 ? 'oklch(0.62 0.14 155)' : '#8A8F97',
                  fontWeight: n.signes > 0 ? 600 : 400,
                }}
              >
                {n.signes > 0 ? `+${n.signes}` : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Par canal */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[16px_20px]">
        <h3 className="text-[13px] font-semibold text-[#111316]">Stats par canal</h3>
        <p className="text-[11px] text-[#8A8F97] mt-0.5 mb-[14px]">Comparatif email vs Instagram</p>

        {canaux.map((c, i) => {
          const color =
            c.canal === 'Email' ? 'oklch(0.62 0.18 25)'
            : c.canal === 'WhatsApp' ? '#25D366'
            : 'oklch(0.58 0.16 295)'
          const rr = c.contactes > 0 ? Math.round((c.reponses / c.contactes) * 100) : 0
          const sr = c.contactes > 0 ? Math.round((c.signes / c.contactes) * 100) : 0
          return (
            <div
              key={c.canal}
              className="py-3"
              style={{ borderTop: i === 0 ? '1px solid #E5E7EB' : 'none', borderBottom: '1px solid #E5E7EB' }}
            >
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color }}>{c.canal}</span>
                  <span className="text-[10px] font-mono text-[#8A8F97] bg-[#F4F5F7] px-[6px] py-[2px] rounded-[4px]">
                    {c.contactes} contactés
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { v: c.contactes, l: 'Contacts', sub: null, tone: 'neutral' },
                  { v: c.reponses, l: 'Réponses', sub: `${rr}%`, tone: rr > 20 ? 'good' : rr > 0 ? 'warn' : 'neutral' },
                  { v: c.signes, l: 'Signés', sub: `${sr}%`, tone: c.signes > 0 ? 'good' : 'neutral' },
                ].map((s, j) => {
                  const col =
                    s.tone === 'good' ? 'oklch(0.62 0.14 155)'
                    : s.tone === 'warn' ? 'oklch(0.72 0.14 75)'
                    : '#111316'
                  return (
                    <div key={j}>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[22px] font-semibold font-mono" style={{ color: col }}>{s.v}</span>
                        {s.sub && <span className="text-[11px] font-mono text-[#8A8F97]">{s.sub}</span>}
                      </div>
                      <div className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.08em] mt-0.5">{s.l}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {canaux.every(c => c.contactes === 0) && (
          <p className="text-[12px] text-[#8A8F97] text-center py-6 italic">Aucune donnée</p>
        )}
      </div>

    </div>
  )
}
