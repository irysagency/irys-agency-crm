'use client'

import { useState, useEffect, useCallback } from 'react'
import { Camera, Play, Link, Mail, Phone, RefreshCw } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { StatutBadge, NicheBadge } from '@/components/ui/Badge'
import { EmailHistory } from './EmailHistory'
import { EmailComposer } from './EmailComposer'
import { createClient } from '@/lib/supabase/client'
import type { Prospect, StatutType, Email } from '@/types'
import { STATUTS } from '@/types'

interface ProspectDrawerProps {
  prospect: Prospect | null
  onClose: () => void
  onUpdate: (prospect: Prospect) => void
}

export function ProspectDrawer({ prospect, onClose, onUpdate }: ProspectDrawerProps) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [updatingStatut, setUpdatingStatut] = useState(false)
  const [statutError, setStatutError] = useState<string | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [emails, setEmails] = useState<Email[]>([])
  const [emailsLoading, setEmailsLoading] = useState(false)

  const fetchEmails = useCallback(async (prospectId: string) => {
    setEmailsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('envoye_le', { ascending: false })
    if (!error && data) setEmails(data as Email[])
    setEmailsLoading(false)
  }, [])

  useEffect(() => {
    if (prospect) {
      setNotes(prospect.notes ?? '')
      setShowComposer(false)
      setStatutError(null)
      setSaveError(null)
      void fetchEmails(prospect.id)
    } else {
      setEmails([])
    }
  }, [prospect?.id, fetchEmails])

  async function handleStatutChange(statut: StatutType) {
    if (!prospect) return
    setUpdatingStatut(true)
    setStatutError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('prospects')
      .update({ statut, derniere_action: new Date().toISOString() })
      .eq('id', prospect.id)
    setUpdatingStatut(false)
    if (error) {
      setStatutError('Erreur lors du changement de statut')
      return
    }
    onUpdate({ ...prospect, statut })
  }

  async function handleNotesSave() {
    if (!prospect) return
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const { error } = await supabase.from('prospects').update({ notes }).eq('id', prospect.id)
    setSaving(false)
    if (error) {
      setSaveError('Erreur lors de la sauvegarde')
      return
    }
    onUpdate({ ...prospect, notes })
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

  const hasEmails = emails.length > 0
  const lastThreadId = emails[0]?.gmail_thread_id ?? null

  return (
    <Drawer
      open={prospect !== null}
      onClose={onClose}
      title={prospect?.nom ?? ''}
    >
      {prospect && (
        <div className="px-6 py-5 space-y-6">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <NicheBadge niche={prospect.niche} />
            <StatutBadge statut={prospect.statut} />
          </div>

          {/* Contacts */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact</h4>
            {prospect.email && (
              <a href={`mailto:${prospect.email}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <Mail className="w-4 h-4" />{prospect.email}
              </a>
            )}
            {prospect.whatsapp && (
              <a href={`https://wa.me/${prospect.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <Phone className="w-4 h-4" />{prospect.whatsapp}
              </a>
            )}
            {prospect.instagram && (
              <a href={`https://instagram.com/${prospect.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <Camera className="w-4 h-4" />{prospect.instagram}
              </a>
            )}
            {prospect.youtube && (
              <a href={prospect.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <Play className="w-4 h-4" />YouTube
              </a>
            )}
            {prospect.linkedin && (
              <a href={prospect.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <Link className="w-4 h-4" />LinkedIn
              </a>
            )}
          </div>

          {/* Changer statut */}
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
            {statutError && <p className="text-xs text-accent-danger mt-2">{statutError}</p>}
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Notes</h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleNotesSave}
              rows={4}
              placeholder="Ajouter des notes..."
              className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors resize-none"
            />
            {saving && <p className="text-xs text-text-secondary mt-1">Sauvegarde...</p>}
            {saveError && <p className="text-xs text-accent-danger mt-1">{saveError}</p>}
          </div>

          {/* Historique emails */}
          <EmailHistory emails={emails} loading={emailsLoading} />

          {/* Bouton relancer ou composer */}
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
            />
          )}
        </div>
      )}
    </Drawer>
  )
}
