'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, ChevronDown } from 'lucide-react'
import type { Prospect } from '@/types'
import type { ToastType } from '@/hooks/useToast'

interface EmailAccount {
  id: string
  label: string
  email: string | null
  signature: string | null
}

interface EmailComposerProps {
  prospect: Prospect
  isReply?: boolean
  threadId?: string | null
  onSent: () => void
  onToast?: (message: string, type?: ToastType) => void
}

export function EmailComposer({ prospect, isReply = false, threadId, onSent, onToast }: EmailComposerProps) {
  const defaultSubject = isReply ? `Re: Collaboration vidéo — ${prospect.nom}` : ''
  const [objet, setObjet]       = useState(defaultSubject)
  const [corps, setCorps]       = useState('')
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [accountId, setAccountId] = useState('')
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/gmail/accounts')
      .then(r => r.json())
      .then((data: EmailAccount[]) => {
        if (data?.length > 0) {
          setAccounts(data)
          setAccountId(data[0].id)
          // Pré-remplir la signature du premier compte
          if (data[0].signature) setCorps('\n\n' + data[0].signature)
        }
      })
      .catch(() => {})
  }, [])

  function handleAccountChange(id: string) {
    setAccountId(id)
    const acc = accounts.find(a => a.id === id)
    if (acc?.signature) {
      // Remplace la signature existante (tout ce qui est après le corps réel)
      setCorps(prev => {
        const sigIndex = prev.indexOf('\n\n')
        const bodyPart = sigIndex !== -1 ? prev.slice(0, sigIndex) : prev
        return bodyPart + '\n\n' + acc.signature
      })
    }
  }

  async function handleSend() {
    if (!corps.trim() || !accountId) return
    if (!isReply && !objet.trim()) return
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: prospect.id,
          to:         prospect.email,
          objet:      isReply ? defaultSubject : objet,
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
      const acc = accounts.find(a => a.id === accountId)
      setCorps(acc?.signature ? '\n\n' + acc.signature : '')
      onToast?.('Email envoyé avec succès')
      onSent()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
      onToast?.(msg, 'error')
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

      {/* Compte expéditeur */}
      <div className="relative">
        <select
          value={accountId}
          onChange={e => handleAccountChange(e.target.value)}
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

      {/* Objet */}
      {!isReply && (
        <input
          type="text"
          placeholder="Objet du mail"
          value={objet}
          onChange={e => setObjet(e.target.value)}
          className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors"
        />
      )}

      {/* Corps + signature */}
      <textarea
        placeholder="Corps du mail..."
        value={corps}
        onChange={e => setCorps(e.target.value)}
        rows={8}
        className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors resize-none font-mono text-xs leading-relaxed"
      />

      {error && <p className="text-xs text-accent-danger">{error}</p>}

      <button
        onClick={handleSend}
        disabled={sending || !corps.trim() || !accountId || (!isReply && !objet.trim())}
        className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'Envoi...' : isReply ? 'Relancer' : 'Envoyer'}
      </button>
    </div>
  )
}
