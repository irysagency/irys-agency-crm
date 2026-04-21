'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import type { Prospect } from '@/types'

interface EmailComposerProps {
  prospect: Prospect
  isReply?: boolean
  threadId?: string | null
  onSent: () => void
}

export function EmailComposer({ prospect, isReply = false, threadId, onSent }: EmailComposerProps) {
  const defaultSubject = isReply ? `Re: Collaboration vidéo — ${prospect.nom}` : ''
  const [objet, setObjet] = useState(defaultSubject)
  const [corps, setCorps] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!corps.trim() || (!isReply && !objet.trim())) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: prospect.id,
          to: prospect.email,
          objet,
          corps,
          ...(threadId ? { threadId } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Erreur lors de l'envoi")
      }
      setObjet(defaultSubject)
      setCorps('')
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        {isReply ? 'Relancer' : 'Envoyer un mail'}
      </h4>
      {!isReply && (
        <input
          type="text"
          placeholder="Objet du mail"
          value={objet}
          onChange={e => setObjet(e.target.value)}
          className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors"
        />
      )}
      <textarea
        placeholder="Corps du mail..."
        value={corps}
        onChange={e => setCorps(e.target.value)}
        rows={6}
        className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors resize-none"
      />
      {error && (
        <p className="text-xs text-accent-danger">{error}</p>
      )}
      <button
        onClick={handleSend}
        disabled={sending || !corps.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'Envoi...' : isReply ? 'Relancer' : 'Envoyer'}
      </button>
    </div>
  )
}
