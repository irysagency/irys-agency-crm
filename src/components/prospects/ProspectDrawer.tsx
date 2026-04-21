'use client'

import { useState, useEffect } from 'react'
import { Camera, Play, Link, Mail, Phone, RefreshCw } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { StatutBadge, NicheBadge } from '@/components/ui/Badge'
import { EmailHistory } from './EmailHistory'
import { EmailComposer } from './EmailComposer'
import { createClient } from '@/lib/supabase/client'
import type { Prospect, StatutType } from '@/types'
import { STATUTS } from '@/types'

interface ProspectDrawerProps {
  prospect: Prospect | null
  onClose: () => void
  onUpdate: (prospect: Prospect) => void
}

export function ProspectDrawer({ prospect, onClose, onUpdate }: ProspectDrawerProps) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [hasEmails, setHasEmails] = useState(false)
  const [emailsKey, setEmailsKey] = useState(0)

  useEffect(() => {
    if (prospect) {
      setNotes(prospect.notes ?? '')
      setShowComposer(false)
      const supabase = createClient()
      supabase
        .from('emails')
        .select('id')
        .eq('prospect_id', prospect.id)
        .limit(1)
        .then(({ data }) => {
          setHasEmails((data?.length ?? 0) > 0)
        })
    }
  }, [prospect?.id])

  async function handleStatutChange(statut: StatutType) {
    if (!prospect) return
    const supabase = createClient()
    await supabase
      .from('prospects')
      .update({ statut, derniere_action: new Date().toISOString() })
      .eq('id', prospect.id)
    onUpdate({ ...prospect, statut })
  }

  async function handleNotesSave() {
    if (!prospect) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('prospects').update({ notes }).eq('id', prospect.id)
    setSaving(false)
    onUpdate({ ...prospect, notes })
  }

  function handleEmailSent() {
    setShowComposer(false)
    setHasEmails(true)
    setEmailsKey(k => k + 1)
    if (prospect && prospect.statut === 'a_contacter') {
      void handleStatutChange('envoye')
    }
  }

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
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Phone className="w-4 h-4" />{prospect.whatsapp}
              </div>
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
                  className={`px-3 py-1.5 rounded-badge text-xs font-medium transition-colors ${
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
          </div>

          {/* Historique emails */}
          <EmailHistory key={emailsKey} prospectId={prospect.id} />

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

          {(!hasEmails || showComposer) && (
            <EmailComposer
              prospect={prospect}
              isReply={hasEmails}
              onSent={handleEmailSent}
            />
          )}
        </div>
      )}
    </Drawer>
  )
}
