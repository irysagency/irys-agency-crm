'use client'

import { useState } from 'react'
import { X, Loader2, User, Mail, Phone } from 'lucide-react'
import type { Prospect, NicheType, SourceType } from '@/types'
import { NICHES, SOURCES } from '@/types'

interface AddProspectModalProps {
  open: boolean
  onClose: () => void
  onCreated: (prospect: Prospect) => void
}

const EMPTY = {
  nom: '',
  niche: '' as NicheType | '',
  source: 'email' as SourceType,
  email: '',
  instagram: '',
  youtube: '',
  linkedin: '',
  whatsapp: '',
  notes: '',
}

export function AddProspectModal({ open, onClose, onCreated }: AddProspectModalProps) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.niche) {
      setError('Nom et niche sont obligatoires')
      return
    }
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Erreur création')
      }
      const prospect = await res.json() as Prospect
      onCreated(prospect)
      setForm(EMPTY)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-sidebar border border-border-color-subtle rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-color-subtle flex-shrink-0">
          <h2 className="font-semibold text-text-primary">Nouveau prospect</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Nom + Niche */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Nom <span className="text-accent-danger">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={set('nom')}
                placeholder="Prénom Nom ou @pseudo"
                autoFocus
                className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Niche <span className="text-accent-danger">*</span>
              </label>
              <select
                value={form.niche}
                onChange={set('niche')}
                className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors"
              >
                <option value="">Sélectionner une niche...</option>
                {NICHES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Source de contact
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SOURCES.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, source: s.key }))}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      form.source === s.key
                        ? 'border-accent-violet bg-accent-violet/10 text-accent-violet'
                        : 'border-border-color-subtle bg-bg-base text-text-secondary hover:text-text-primary hover:border-accent-violet/40'
                    }`}
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span className="truncate w-full text-center">{s.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Contacts</p>
            <div className="space-y-2">
              {[
                { field: 'email' as const, placeholder: 'Email', icon: <Mail className="w-3.5 h-3.5" />, type: 'email' },
                { field: 'whatsapp' as const, placeholder: 'WhatsApp (+33...)', icon: <Phone className="w-3.5 h-3.5" />, type: 'text' },
                { field: 'instagram' as const, placeholder: 'Instagram (@pseudo)', icon: <span className="text-[10px] font-bold">IG</span>, type: 'text' },
                { field: 'youtube' as const, placeholder: 'YouTube (URL)', icon: <span className="text-[10px] font-bold">YT</span>, type: 'url' },
                { field: 'linkedin' as const, placeholder: 'LinkedIn (URL)', icon: <span className="text-[10px] font-bold">LI</span>, type: 'url' },
              ].map(({ field, placeholder, icon, type }) => (
                <div key={field} className="flex items-center gap-2 bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 focus-within:border-accent-violet transition-colors">
                  <span className="text-text-secondary flex-shrink-0 w-4 flex items-center justify-center">{icon}</span>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={set(field)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Infos utiles sur ce prospect..."
              className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors resize-none"
            />
          </div>

          {error && <p className="text-xs text-accent-danger">{error}</p>}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border-color-subtle flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.nom.trim() || !form.niche}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Création...' : 'Créer le prospect'}
          </button>
        </div>
      </div>
    </div>
  )
}
