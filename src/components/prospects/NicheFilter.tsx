'use client'

import { clsx } from 'clsx'
import { NICHES } from '@/types'
import type { NicheType } from '@/types'

interface NicheFilterProps {
  selected: NicheType | null
  onChange: (niche: NicheType | null) => void
}

export function NicheFilter({ selected, onChange }: NicheFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={clsx(
          'px-3 py-1.5 rounded-badge text-xs font-medium transition-colors',
          selected === null
            ? 'bg-accent-violet text-white'
            : 'bg-white/5 text-text-secondary hover:text-text-primary'
        )}
      >
        Tous
      </button>
      {NICHES.map(niche => (
        <button
          key={niche}
          onClick={() => onChange(niche)}
          className={clsx(
            'px-3 py-1.5 rounded-badge text-xs font-medium transition-colors',
            selected === niche
              ? 'bg-accent-violet text-white'
              : 'bg-white/5 text-text-secondary hover:text-text-primary'
          )}
        >
          {niche}
        </button>
      ))}
    </div>
  )
}
