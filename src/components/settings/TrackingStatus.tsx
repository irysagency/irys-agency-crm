'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface TrackingStatusProps {
  delaiJours: number
}

export function TrackingStatus({ delaiJours }: TrackingStatusProps) {
  const [delay, setDelay] = useState(delaiJours)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const res = await fetch('/api/settings/relance-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delaiJours: delay }),
      })
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-xl p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Délai de relance</h3>
      <p className="text-xs text-text-secondary mb-4">
        Nombre de jours sans réponse avant qu'un prospect apparaisse dans les relances.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={30}
            value={delay}
            onChange={e => setDelay(Math.max(1, Math.min(30, Number(e.target.value))))}
            className="w-20 bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors text-center"
          />
          <span className="text-sm text-text-secondary">jours</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
        {saved && <span className="text-xs text-accent-success">Sauvegardé ✓</span>}
        {error && <span className="text-xs text-accent-danger">{error}</span>}
      </div>
    </div>
  )
}
