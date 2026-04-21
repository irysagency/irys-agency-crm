'use client'

import { useState, useEffect, useCallback } from 'react'
import { Camera, Play, Link, Mail, Phone, RefreshCw, Pencil, X, Check, Loader2 } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { StatutBadge, NicheBadge } from '@/components/ui/Badge'
import { Toaster } from '@/components/ui/Toast'
import { EmailHistory } from './EmailHistory'
import { EmailComposer } from './EmailComposer'
import { useToast } from '@/hooks/useToast'
import type { Prospect, StatutType, NicheType, Email } from '@/types'
import { STATUTS, NICHES } from '@/types'

interface ProspectDrawerProps {
  prospect: Prospect | null
  onClose: () => void
  onUpdate: (prospect: Prospect) => void
}

type EditableFields = {
  nom: string
  niche: NicheType | ''
  email: string
  whatsapp: string
  instagram: string
  youtube: string
  linkedin: string
  notes: string
}

function toEditFields(p: Prospect): EditableFields {
  return {
    nom:       p.nom            ?? '',
    niche:     p.niche          ?? '',
    email:     p.email          ?? '',
    whatsapp:  p.whatsapp       ?? '',
    instagram: p.instagram      ?? '',
    youtube:   p.youtube        ?? '',
    linkedin:  p.linkedin       ?? '',
    notes:     p.notes          ?? '',
  }
}

export function ProspectDrawer({ prospect, onClose, onUpdate }: ProspectDrawerProps) {
  const { toasts, toast, dismiss } = useToast()
  const [editing, setEditing]   = useState(false)
  const [fields, setFields]     = useState<EditableFields>(toEditFields(prospect ?? {} as Prospect))
  const [saving, setSaving]     = useState(false)
  const [updatingStatut, setUpdatingStatut] = useState(false)
  const [showComposer, setShowComposer]     = useState(false)
  const [emails, setEmails]                 = useState<Email[]>([])
  const [emailsLoading, setEmailsLoading]   = useState(false)

  const fetchEmails = useCallback(async (id: string) => {
    setEmailsLoading(true)
    const res = await fetch(`/api/emails?prospectId=${id}`)
    if (res.ok) setEmails(await res.json() as Email[])
    setEmailsLoading(false)
  }, [])

  useEffect(() => {
    if (prospect) {
      setFields(toEditFields(prospect))
      setEditing(false)
      setShowComposer(false)
      void fetchEmails(prospect.id)
    } else {
      setEmails([])
    }
  }, [prospect?.id, fetchEmails])

  function set(field: keyof EditableFields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFields(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSave() {
    if (!prospect) return
    setSaving(true)
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json() as Prospect
      onUpdate(updated)
      setEditing(false)
      toast('Prospect mis à jour')
    } catch {
      toast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (prospect) setFields(toEditFields(prospect))
    setEditing(false)
  }

  async function handleStatutChange(statut: StatutType) {
    if (!prospect) return
    setUpdatingStatut(true)
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json() as Prospect
      onUpdate(updated)
      toast(`Statut → ${STATUTS.find(s => s.key === statut)?.label}`)
    } catch {
      toast('Erreur changement de statut', 'error')
    } finally {
      setUpdatingStatut(false)
    }
  }

  async function handleEmailSent() {
    setShowComposer(false)
    if (prospect) {
      await fetchEmails(prospect.id)
      if (prospect.statut === 'a_contacter') {
        await handleStatutChange('envoye')
      }
    }
  }

  const hasEmails   = emails.length > 0
  const lastThreadId = emails[0]?.gmail_thread_id ?? null

  const inputCls = 'w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors'

  return (
    <>
      <Drawer open={prospect !== null} onClose={onClose} title={prospect?.nom ?? ''}>
        {prospect && (
          <div className="px-6 py-5 space-y-6">

            {/* Header actions */}
            <div className="flex items-center gap-2">
              <NicheBadge niche={prospect.niche} />
              <StatutBadge statut={prospect.statut} />
              <div className="ml-auto">
                {editing ? (
                  <div className="flex gap-1">
                    <button
                      onClick={handleCancel}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Sauvegarder
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Éditer
                  </button>
                )}
              </div>
            </div>

            {/* Infos éditables */}
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Nom</label>
                  <input type="text" value={fields.nom} onChange={set('nom')} className={inputCls} placeholder="Nom du prospect" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Niche</label>
                  <select value={fields.niche} onChange={set('niche')} className={inputCls}>
                    <option value="">Sélectionner...</option>
                    {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {[
                  { field: 'email'     as const, label: 'Email',     placeholder: 'email@exemple.com', type: 'email' },
                  { field: 'whatsapp'  as const, label: 'WhatsApp',  placeholder: '+33...',            type: 'text'  },
                  { field: 'instagram' as const, label: 'Instagram', placeholder: '@pseudo ou URL',    type: 'text'  },
                  { field: 'youtube'   as const, label: 'YouTube',   placeholder: 'URL de la chaîne',  type: 'url'   },
                  { field: 'linkedin'  as const, label: 'LinkedIn',  placeholder: 'URL du profil',     type: 'url'   },
                ].map(({ field, label, placeholder, type }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</label>
                    <input type={type} value={fields[field]} onChange={set(field)} className={inputCls} placeholder={placeholder} />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Notes</label>
                  <textarea value={fields.notes} onChange={set('notes')} rows={4} className={`${inputCls} resize-none`} placeholder="Notes..." />
                </div>
              </div>
            ) : (
              <>
                {/* Contacts (lecture) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact</h4>
                  {prospect.email && (
                    <a href={`mailto:${prospect.email}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <Mail className="w-4 h-4 flex-shrink-0" />{prospect.email}
                    </a>
                  )}
                  {prospect.whatsapp && (
                    <a href={`https://wa.me/${prospect.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <Phone className="w-4 h-4 flex-shrink-0" />{prospect.whatsapp}
                    </a>
                  )}
                  {prospect.instagram && (
                    <a href={prospect.instagram.startsWith('http') ? prospect.instagram : `https://instagram.com/${prospect.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <Camera className="w-4 h-4 flex-shrink-0" />{prospect.instagram}
                    </a>
                  )}
                  {prospect.youtube && (
                    <a href={prospect.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <Play className="w-4 h-4 flex-shrink-0" />YouTube
                    </a>
                  )}
                  {prospect.linkedin && (
                    <a href={prospect.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <Link className="w-4 h-4 flex-shrink-0" />LinkedIn
                    </a>
                  )}
                  {!prospect.email && !prospect.whatsapp && !prospect.instagram && !prospect.youtube && !prospect.linkedin && (
                    <button onClick={() => setEditing(true)} className="text-xs text-accent-violet hover:underline">
                      + Ajouter des infos de contact
                    </button>
                  )}
                </div>

                {/* Notes (lecture) */}
                {prospect.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Notes</h4>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{prospect.notes}</p>
                  </div>
                )}
              </>
            )}

            {/* Statut */}
            {!editing && (
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Statut</h4>
                <div className="flex flex-wrap gap-2">
                  {STATUTS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleStatutChange(key)}
                      disabled={updatingStatut}
                      className={`px-3 py-1.5 rounded-badge text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        prospect.statut === key
                          ? 'bg-accent-violet text-white'
                          : 'bg-white/5 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Historique emails */}
            {!editing && <EmailHistory emails={emails} loading={emailsLoading} />}

            {/* Composer */}
            {!editing && (
              <>
                {hasEmails && !showComposer && (
                  <button
                    onClick={() => setShowComposer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full justify-center"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Relancer
                  </button>
                )}

                {prospect.email && (!hasEmails || showComposer) && (
                  <EmailComposer
                    prospect={prospect}
                    isReply={hasEmails}
                    threadId={lastThreadId}
                    onSent={handleEmailSent}
                    onToast={toast}
                  />
                )}

                {!prospect.email && !editing && (
                  <div className="text-xs text-text-secondary bg-bg-base rounded-lg px-4 py-3 border border-border-color-subtle text-center">
                    <button onClick={() => setEditing(true)} className="text-accent-violet hover:underline">Ajouter un email</button>
                    {' '}pour pouvoir envoyer un message
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Drawer>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  )
}
