'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Camera, Play, Link, Mail, Phone, RefreshCw, Loader2, Check, X } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { StatutBadge, NicheBadge } from '@/components/ui/Badge'
import { Toaster } from '@/components/ui/Toast'
import { EmailHistory } from './EmailHistory'
import { EmailComposer } from './EmailComposer'
import { useToast } from '@/hooks/useToast'
import type { Prospect, StatutType, Email } from '@/types'
import { STATUTS, NICHES } from '@/types'

interface ProspectDrawerProps {
  prospect: Prospect | null
  onClose: () => void
  onUpdate: (prospect: Prospect) => void
}

// ---------- InlineField ----------
interface InlineFieldProps {
  label: string
  value: string
  type?: 'text' | 'email' | 'url' | 'tel'
  placeholder?: string
  onSave: (val: string) => Promise<void>
  renderRead?: (val: string) => React.ReactNode
  multiline?: boolean
}

function InlineField({ label, value, type = 'text', placeholder, onSave, renderRead, multiline }: InlineFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(false)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  function startEdit() { setDraft(value); setError(false); setEditing(true) }

  async function commit() {
    if (draft === value) { setEditing(false); return }
    setSaving(true)
    try { await onSave(draft); setEditing(false) }
    catch { setError(true) }
    finally { setSaving(false) }
  }

  function cancel() { setDraft(value); setEditing(false); setError(false) }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); void commit() }
    if (e.key === 'Escape') { e.stopPropagation(); cancel() }
  }

  const sharedInputCls = `w-full bg-white border rounded-[8px] px-3 py-2 text-[13px] text-[#111316] placeholder:text-[#8A8F97] focus:outline-none transition-colors ${
    error ? 'border-[oklch(0.62_0.18_25)]' : 'border-[#E5E7EB] focus:border-[oklch(0.62_0.14_155)]'
  }`

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.1em]">{label}</span>
        {!editing && (
          <button
            onClick={startEdit}
            className="opacity-0 group-hover:opacity-100 text-[10px] text-[oklch(0.62_0.14_155)] hover:text-[oklch(0.38_0.10_155)] transition-all"
          >
            Modifier
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              ref={ref as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => void commit()}
              rows={4}
              placeholder={placeholder}
              className={sharedInputCls + ' resize-none'}
            />
          ) : (
            <input
              ref={ref as React.RefObject<HTMLInputElement>}
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => void commit()}
              placeholder={placeholder}
              className={sharedInputCls}
            />
          )}
          <div className="flex flex-col gap-1 flex-shrink-0 pt-1">
            <button
              onMouseDown={e => { e.preventDefault(); void commit() }}
              disabled={saving}
              className="p-1.5 rounded-[7px] bg-[oklch(0.95_0.04_155)] text-[oklch(0.62_0.14_155)] hover:bg-[oklch(0.90_0.06_155)] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </button>
            <button
              onMouseDown={e => { e.preventDefault(); cancel() }}
              className="p-1.5 rounded-[7px] bg-[#F4F5F7] text-[#8A8F97] hover:bg-[#E5E7EB] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <button onClick={startEdit} className="w-full text-left px-[10px] py-2 border border-[#E5E7EB] rounded-[8px] bg-white hover:border-[#D6D9DE] transition-colors">
          {value && renderRead ? (
            renderRead(value)
          ) : value ? (
            <span className="text-[13px] text-[#111316]">{value}</span>
          ) : (
            <span className="text-[13px] text-[#8A8F97] italic">{placeholder ?? 'Cliquer pour ajouter…'}</span>
          )}
        </button>
      )}
    </div>
  )
}

// ---------- InlineSelect ----------
interface InlineSelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  placeholder?: string
  onSave: (val: string) => Promise<void>
}

function InlineSelect({ label, value, options, placeholder, onSave }: InlineSelectProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const [saving, setSaving]   = useState(false)
  const ref = useRef<HTMLSelectElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  async function commit(val: string) {
    setDraft(val)
    if (val === value) { setEditing(false); return }
    setSaving(true)
    try { await onSave(val) } finally { setSaving(false); setEditing(false) }
  }

  const displayed = options.find(o => o.value === value)?.label

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.1em]">{label}</span>
        {saving && <Loader2 className="w-3 h-3 animate-spin text-[#8A8F97]" />}
      </div>
      {editing ? (
        <select
          ref={ref}
          value={draft}
          onChange={e => void commit(e.target.value)}
          onBlur={() => { if (!saving) setEditing(false) }}
          className="w-full bg-white border border-[oklch(0.62_0.14_155)] rounded-[8px] px-3 py-2 text-[13px] text-[#111316] focus:outline-none transition-colors"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left px-[10px] py-2 border border-[#E5E7EB] rounded-[8px] bg-white hover:border-[#D6D9DE] transition-colors"
        >
          {displayed ? (
            <span className="text-[13px] text-[#111316]">{displayed}</span>
          ) : (
            <span className="text-[13px] text-[#8A8F97] italic">{placeholder ?? 'Cliquer pour sélectionner…'}</span>
          )}
        </button>
      )}
    </div>
  )
}

// ---------- ProspectDrawer ----------
export function ProspectDrawer({ prospect, onClose, onUpdate }: ProspectDrawerProps) {
  const { toasts, toast, dismiss } = useToast()
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
    if (prospect) { setShowComposer(false); void fetchEmails(prospect.id) }
    else setEmails([])
  }, [prospect?.id, fetchEmails])

  async function patchField(field: string, value: string) {
    if (!prospect) return
    const res = await fetch(`/api/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value || null }),
    })
    if (!res.ok) { toast('Erreur lors de la sauvegarde', 'error'); throw new Error() }
    const updated = await res.json() as Prospect
    onUpdate(updated)
    toast('Modifié')
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
      if (prospect.statut === 'a_contacter') await handleStatutChange('envoye')
    }
  }

  const hasEmails    = emails.length > 0
  const lastThreadId = emails[0]?.gmail_thread_id ?? null

  const STATUT_DOT: Record<string, string> = {
    a_contacter: '#8A8F97',
    envoye: 'oklch(0.58 0.14 245)',
    ouvert: 'oklch(0.72 0.14 75)',
    repondu: 'oklch(0.58 0.16 295)',
    call_booke: 'oklch(0.64 0.18 340)',
    signe: 'oklch(0.62 0.14 155)',
    refuse: 'oklch(0.62 0.18 25)',
  }

  return (
    <>
      <Drawer open={prospect !== null} onClose={onClose} title={prospect?.nom ?? ''}>
        {prospect && (
          <div className="px-6 py-5 space-y-5">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <NicheBadge niche={prospect.niche} />
              <StatutBadge statut={prospect.statut} />
            </div>

            {/* Champs inline */}
            <div className="space-y-3">
              <InlineField
                label="Nom"
                value={prospect.nom ?? ''}
                placeholder="Nom du prospect"
                onSave={v => patchField('nom', v)}
              />
              <InlineSelect
                label="Niche"
                value={prospect.niche ?? ''}
                options={NICHES.map(n => ({ value: n, label: n }))}
                placeholder="Sélectionner une niche…"
                onSave={v => patchField('niche', v)}
              />
              <InlineSelect
                label="Canal de contact"
                value={prospect.canal_contact ?? ''}
                options={[
                  { value: 'email',     label: '✉️ Email' },
                  { value: 'instagram', label: '📸 Instagram' },
                  { value: 'whatsapp',  label: '💬 WhatsApp' },
                  { value: 'autre',     label: '🔗 Autre' },
                ]}
                placeholder="Par quel canal contacté ?"
                onSave={v => patchField('canal_contact', v)}
              />
              <InlineField
                label="Email"
                value={prospect.email ?? ''}
                type="email"
                placeholder="email@exemple.com"
                onSave={v => patchField('email', v)}
                renderRead={v => (
                  <a href={`mailto:${v}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[13px] text-[oklch(0.62_0.14_155)] hover:text-[oklch(0.38_0.10_155)] transition-colors">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />{v}
                  </a>
                )}
              />
              <InlineField
                label="WhatsApp"
                value={prospect.whatsapp ?? ''}
                type="tel"
                placeholder="+33..."
                onSave={v => patchField('whatsapp', v)}
                renderRead={v => (
                  <a href={`https://wa.me/${v.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[13px] text-[#111316] hover:text-[oklch(0.62_0.14_155)] transition-colors">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />{v}
                  </a>
                )}
              />
              <InlineField
                label="Instagram"
                value={prospect.instagram ?? ''}
                placeholder="@pseudo ou URL"
                onSave={v => patchField('instagram', v)}
                renderRead={v => (
                  <a href={v.startsWith('http') ? v : `https://instagram.com/${v.replace('@', '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[13px] text-[#111316] hover:text-[oklch(0.62_0.14_155)] transition-colors">
                    <Camera className="w-3.5 h-3.5 flex-shrink-0" />{v}
                  </a>
                )}
              />
              <InlineField
                label="YouTube"
                value={prospect.youtube ?? ''}
                type="url"
                placeholder="URL de la chaîne"
                onSave={v => patchField('youtube', v)}
                renderRead={v => (
                  <a href={v} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[13px] text-[#111316] hover:text-[oklch(0.62_0.14_155)] transition-colors">
                    <Play className="w-3.5 h-3.5 flex-shrink-0" />YouTube
                  </a>
                )}
              />
              <InlineField
                label="LinkedIn"
                value={prospect.linkedin ?? ''}
                type="url"
                placeholder="URL du profil"
                onSave={v => patchField('linkedin', v)}
                renderRead={v => (
                  <a href={v} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[13px] text-[#111316] hover:text-[oklch(0.62_0.14_155)] transition-colors">
                    <Link className="w-3.5 h-3.5 flex-shrink-0" />LinkedIn
                  </a>
                )}
              />
              <InlineField
                label="Notes"
                value={prospect.notes ?? ''}
                placeholder="Notes libres…"
                multiline
                onSave={v => patchField('notes', v)}
              />
            </div>

            {/* Statut */}
            <div>
              <h4 className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.1em] mb-2">Statut</h4>
              <div className="flex flex-wrap gap-1.5">
                {STATUTS.map(({ key, label }) => {
                  const isActive = prospect.statut === key
                  const dot = STATUT_DOT[key]
                  return (
                    <button
                      key={key}
                      onClick={() => void handleStatutChange(key)}
                      disabled={updatingStatut}
                      className={[
                        'px-[11px] py-[5px] rounded-full text-[11px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border',
                        isActive
                          ? 'text-white border-transparent'
                          : 'bg-white text-[#474B52] border-[#E5E7EB] hover:bg-[#F4F5F7]',
                      ].join(' ')}
                      style={isActive ? { background: dot, borderColor: 'transparent' } : {}}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Timeline étapes */}
            {prospect.etapes && prospect.etapes.length > 0 && (
              <div>
                <h4 className="text-[10px] font-mono text-[#8A8F97] uppercase tracking-[0.1em] mb-3">Parcours</h4>
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#E5E7EB]" />
                  <div className="space-y-3 pl-5">
                    {prospect.etapes.map((etape, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#E5E7EB] bg-white flex items-center justify-center">
                          {i === prospect.etapes.length - 1 && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'oklch(0.62 0.14 155)' }} />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium text-[#474B52]">
                            {STATUTS.find(s => s.key === etape.statut)?.label ?? etape.statut}
                          </span>
                          <span className="text-[10px] font-mono text-[#8A8F97]">
                            {new Date(etape.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Historique emails */}
            <EmailHistory emails={emails} loading={emailsLoading} />

            {/* Composer / Relancer */}
            <>
              {hasEmails && !showComposer && (
                <button
                  onClick={() => setShowComposer(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#F4F5F7] hover:bg-[#E5E7EB] rounded-[10px] text-[13px] font-medium text-[#474B52] hover:text-[#111316] transition-colors w-full justify-center border border-[#E5E7EB]"
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

              {!prospect.email && (
                <div className="text-[12px] text-[#8A8F97] bg-[#FAFBFC] rounded-[10px] px-4 py-3 border border-[#E5E7EB] text-center">
                  Cliquer sur <span className="text-[#111316] font-medium">Email</span> ci-dessus pour ajouter une adresse et envoyer un message
                </div>
              )}
            </>

          </div>
        )}
      </Drawer>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  )
}
