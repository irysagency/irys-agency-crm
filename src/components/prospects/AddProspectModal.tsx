'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Prospect, NicheType } from '@/types'
import { NICHES } from '@/types'

interface AddProspectModalProps {
  open: boolean
  onClose: () => void
  onCreated: (prospect: Prospect) => void
}

const EMPTY = {
  nom: '',
  niche: '' as NicheType | '',
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
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white border border-[#E5E7EB] rounded-[16px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl shadow-black/8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-[18px] border-b border-[#E5E7EB] flex-shrink-0">
          <h2 className="text-[15px] font-semibold text-[#111316]">Nouveau prospect</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] hover:bg-[#F4F5F7] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#8A8F97]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* Nom */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.08em]">
              NOM <span className="text-[oklch(0.62_0.18_25)]">*</span>
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={set('nom')}
              placeholder="Prénom Nom ou @pseudo"
              autoFocus
              className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#111316] placeholder:text-[#8A8F97] focus:outline-none focus:border-[oklch(0.62_0.14_155)] transition-colors"
            />
          </div>

          {/* Niche */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.08em]">
              NICHE <span className="text-[oklch(0.62_0.18_25)]">*</span>
            </label>
            <select
              value={form.niche}
              onChange={set('niche')}
              className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#111316] focus:outline-none focus:border-[oklch(0.62_0.14_155)] transition-colors"
            >
              <option value="">Sélectionner une niche...</option>
              {NICHES.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.08em]">CONTACTS</p>
            <div className="flex flex-col gap-2">
              {[
                { field: 'email'     as const, placeholder: 'Email',              icon: '✉' },
                { field: 'whatsapp'  as const, placeholder: 'WhatsApp (+33...)',   icon: '✆' },
                { field: 'instagram' as const, placeholder: 'Instagram (@pseudo)', icon: 'IG' },
                { field: 'youtube'   as const, placeholder: 'YouTube (URL)',       icon: 'YT' },
                { field: 'linkedin'  as const, placeholder: 'LinkedIn (URL)',      icon: 'LI' },
              ].map(({ field, placeholder, icon }) => (
                <div
                  key={field}
                  className="flex items-center gap-2 bg-[#F4F5F7] border border-[#E5E7EB] rounded-[8px] px-3 py-2 focus-within:border-[oklch(0.62_0.14_155)] transition-colors"
                >
                  <span className="text-[11px] font-mono text-[#8A8F97] flex-shrink-0 w-5 text-center">{icon}</span>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={set(field)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-[13px] text-[#111316] placeholder:text-[#8A8F97] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.08em]">NOTES</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Infos utiles sur ce prospect..."
              className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#111316] placeholder:text-[#8A8F97] focus:outline-none focus:border-[oklch(0.62_0.14_155)] transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-[12px]" style={{ color: 'oklch(0.62 0.18 25)' }}>{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-[14px] border-t border-[#E5E7EB] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-[9px] bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] font-medium text-[#474B52] hover:bg-[#F4F5F7] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.nom.trim() || !form.niche}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-[9px] bg-[#111316] hover:bg-[#474B52] disabled:opacity-40 disabled:cursor-not-allowed rounded-[8px] text-[12px] font-medium text-white transition-colors"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Création...' : 'Créer le prospect'}
          </button>
        </div>
      </div>
    </div>
  )
}
