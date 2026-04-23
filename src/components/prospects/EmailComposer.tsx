'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, ChevronDown, FileText } from 'lucide-react'
import type { Prospect } from '@/types'
import type { ToastType } from '@/hooks/useToast'
import { EMAIL_TEMPLATES, applyTemplate } from '@/lib/emailTemplates'

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

const inputCls = 'w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111316] placeholder:text-[#8A8F97] focus:outline-none focus:border-[oklch(0.62_0.14_155)] transition-colors'

export function EmailComposer({ prospect, isReply = false, threadId, onSent, onToast }: EmailComposerProps) {
  const defaultSubject = isReply ? `Re: Collaboration vidéo — ${prospect.nom}` : ''
  const [objet, setObjet]         = useState(defaultSubject)
  const [corps, setCorps]         = useState('')
  const [accounts, setAccounts]   = useState<EmailAccount[]>([])
  const [accountId, setAccountId] = useState('')
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    fetch('/api/gmail/accounts')
      .then(r => r.json())
      .then((data: EmailAccount[]) => {
        if (data?.length > 0) {
          setAccounts(data)
          setAccountId(data[0].id)
          if (data[0].signature) setCorps('\n\n' + data[0].signature)
        }
      })
      .catch(() => {})
  }, [])

  function handleAccountChange(id: string) {
    setAccountId(id)
    const acc = accounts.find(a => a.id === id)
    if (acc?.signature) {
      setCorps(prev => {
        const sigIndex = prev.indexOf('\n\n')
        const bodyPart = sigIndex !== -1 ? prev.slice(0, sigIndex) : prev
        return bodyPart + '\n\n' + acc.signature
      })
    }
  }

  function handleSelectTemplate(templateId: string) {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId)
    if (!tpl) return
    const prenom = prospect.nom.split(' ')[0]
    const applied = applyTemplate(tpl, prenom)
    const acc = accounts.find(a => a.id === accountId)
    const sig = acc?.signature ? '\n\n' + acc.signature : ''
    setObjet(applied.objet)
    setCorps(applied.corps + sig)
    setShowTemplates(false)
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
          to: prospect.email,
          objet: isReply ? defaultSubject : objet,
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
      <div className="text-xs text-[#8A8F97] bg-[#FAFBFC] rounded-xl px-4 py-3 border border-[#E5E7EB]">
        Aucun compte Gmail connecté —{' '}
        <a href="/settings" className="text-[oklch(0.62_0.14_155)] hover:underline">configurer dans Paramètres</a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#8A8F97] uppercase tracking-wider font-mono">
          {isReply ? 'Relancer' : 'Envoyer un mail'}
        </h4>

        {/* Bouton templates */}
        <div className="relative">
          <button
            onClick={() => setShowTemplates(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[oklch(0.95_0.04_155)] hover:bg-[oklch(0.92_0.06_155)] border border-[oklch(0.85_0.06_155)] rounded-lg text-xs font-medium text-[oklch(0.62_0.14_155)] transition-colors"
          >
            <FileText className="w-3 h-3" />
            Templates
          </button>
          {showTemplates && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-10 overflow-hidden">
              {EMAIL_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className="w-full text-left px-4 py-3 text-sm text-[#111316] hover:bg-[#F4F5F7] transition-colors border-b border-[#E5E7EB] last:border-0"
                >
                  <p className="font-medium">{tpl.label}</p>
                  <p className="text-xs text-[#8A8F97] mt-0.5 truncate">{tpl.objet.replace('{{prénom}}', prospect.nom.split(' ')[0])}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compte expéditeur */}
      <div className="relative">
        <select
          value={accountId}
          onChange={e => handleAccountChange(e.target.value)}
          className={inputCls + ' appearance-none pr-8'}
        >
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.label}{acc.email ? ` — ${acc.email}` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F97] pointer-events-none" />
      </div>

      {/* Objet */}
      {!isReply && (
        <input
          type="text"
          placeholder="Objet du mail"
          value={objet}
          onChange={e => setObjet(e.target.value)}
          className={inputCls}
        />
      )}

      {/* Corps */}
      <textarea
        placeholder="Corps du mail..."
        value={corps}
        onChange={e => setCorps(e.target.value)}
        rows={8}
        className={inputCls + ' resize-none font-mono text-xs leading-relaxed'}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSend}
        disabled={sending || !corps.trim() || !accountId || (!isReply && !objet.trim())}
        className="flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.62_0.14_155)] hover:bg-[oklch(0.56_0.14_155)] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors w-full justify-center"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'Envoi...' : isReply ? 'Relancer' : 'Envoyer'}
      </button>
    </div>
  )
}
