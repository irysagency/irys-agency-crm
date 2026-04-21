'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Prospect } from '@/types'

interface EmailAccount {
  id: string
  label: string
  email: string | null
}

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
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [accountId, setAccountId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('email_accounts').select('id, label, email').order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAccounts(data as EmailAccount[])
          setAccountId(data[0].id)
        }
      })
  }, [])

  async function handleSend() {
    if (!corps.trim() || (!isReply && !objet.trim()) || !accountId) return
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
          accountId,
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

  if (accounts.length === 0) {
    return (
      <div className="text-xs text-text-secondary bg-bg-base rounded-lg px-4 py-3 border border-border-color-subtle">
        Aucun compte Gmail connecté —{' '}
        <a href="/settings" className="text-accent-violet hover:underline">configurer dans Paramètres</a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        {isReply ? 'Relancer' : 'Envoyer un mail'}
      </h4>

      {/* Sélecteur de compte */}
      <div className="relative">
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="w-full appearance-none bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 pr-8 text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors"
        >
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.label}{acc.email ? ` — ${acc.email}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
      </div>

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
      {error && <p className="text-xs text-accent-danger">{error}</p>}
      <button
        onClick={handleSend}
        disabled={sending || !corps.trim() || !accountId}
        className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'Envoi...' : isReply ? 'Relancer' : 'Envoyer'}
      </button>
    </div>
  )
}
