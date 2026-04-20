'use client'

import { usePathname } from 'next/navigation'

const TITLES: Record<string, string> = {
  '/': "Vue d'ensemble",
  '/prospects': 'Prospects',
  '/relances': 'Relances',
  '/settings': 'Paramètres',
}

export function TopbarTitle() {
  const pathname = usePathname()
  return (
    <div>
      <h1 className="font-semibold text-text-primary">
        {TITLES[pathname] ?? 'Irys CRM'}
      </h1>
    </div>
  )
}
