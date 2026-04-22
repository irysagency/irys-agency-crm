'use client'

import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface TrackingStatusProps {
  delaiEnvoye: number
  delaiOuvert: number
}

export function TrackingStatus({ delaiEnvoye, delaiOuvert }: TrackingStatusProps) {
  const [envoye, setEnvoye] = useState(delaiEnvoye)
  const [ouvert, setOuvert] = useState(delaiOuvert)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = envoye !== delaiEnvoye || ouvert !== delaiOuvert

  async function handleSave() {
    setSaving(true); setSaved(false); setError(null)
    try {
      const res = await fetch('/api/settings/relance-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delaiEnvoye: envoye, delaiOuvert: ouvert }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erreur sauvegarde')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Délais de relance</h3>
        <p className="text-xs text-text-secondary">
          Un prospect apparaît dans les relances quand sa dernière action date de plus de N jours.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs text-text-secondary">Statut <strong>Envoyé</strong> (pas d&apos;ouverture)</span>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={30} value={envoye}
              onChange={e => setEnvoye(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="w-20 bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors text-center"
            />
            <span className="text-sm text-text-secondary">jours</span>
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs text-text-secondary">Statut <strong>Ouvert</strong> (pas de réponse)</span>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={30} value={ouvert}
              onChange={e => setOuvert(Math.max(1, Math.min(30, Number(e.target.value))))}
              className="w-20 bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors text-center"
            />
            <span className="text-sm text-text-secondary">jours</span>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving || !dirty}
          className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
        {saved && <span className="text-xs text-accent-success">Sauvegardé ✓</span>}
        {error && <span className="text-xs text-accent-danger">{error}</span>}
      </div>
    </div>
  )
}
