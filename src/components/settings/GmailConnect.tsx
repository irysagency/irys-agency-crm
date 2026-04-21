'use client'

import { useState } from 'react'
import { CheckCircle, Trash2, Plus, Loader2, Mail, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface EmailAccount {
  id: string
  label: string
  email: string | null
  signature?: string | null
}

interface GmailConnectProps {
  accounts: EmailAccount[]
}

export function GmailConnect({ accounts: initialAccounts }: GmailConnectProps) {
  const [accounts, setAccounts]         = useState<EmailAccount[]>(initialAccounts)
  const [newLabel, setNewLabel]         = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [connecting, setConnecting]     = useState<string | null>(null)
  const [deleting, setDeleting]         = useState<string | null>(null)
  const [syncing, setSyncing]           = useState(false)
  const [syncResult, setSyncResult]     = useState<string | null>(null)
  const [expandedSig, setExpandedSig]   = useState<string | null>(null)
  const [sigDraft, setSigDraft]         = useState<Record<string, string>>({})
  const [savingSig, setSavingSig]       = useState<string | null>(null)

  function handleConnect(label: string) {
    setConnecting(label)
    window.location.href = `/api/gmail/auth?label=${encodeURIComponent(label)}`
  }

  function handleAddNew() {
    if (!newLabel.trim()) return
    handleConnect(newLabel.trim())
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch('/api/gmail/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAccounts(prev => prev.filter(a => a.id !== id))
    setDeleting(null)
  }

  async function handleSyncReplies() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/gmail/sync-replies', { method: 'POST' })
      const data = await res.json() as { updated?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setSyncResult(data.updated === 0
        ? 'Aucune nouvelle réponse détectée'
        : `${data.updated} prospect${data.updated! > 1 ? 's' : ''} passé${data.updated! > 1 ? 's' : ''} en "Répondu"`)
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSyncing(false)
    }
  }

  function toggleSig(id: string, current: string | null | undefined) {
    if (expandedSig === id) {
      setExpandedSig(null)
    } else {
      setExpandedSig(id)
      setSigDraft(prev => ({ ...prev, [id]: current ?? '' }))
    }
  }

  async function saveSig(id: string) {
    setSavingSig(id)
    await fetch('/api/gmail/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, signature: sigDraft[id] ?? '' }),
    })
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, signature: sigDraft[id] } : a))
    setSavingSig(null)
    setExpandedSig(null)
  }

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-xl p-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold text-text-primary">Comptes Gmail</h3>
        {accounts.length > 0 && (
          <button
            onClick={handleSyncReplies}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Vérification...' : 'Sync réponses'}
          </button>
        )}
      </div>
      <p className="text-xs text-text-secondary mb-1">
        Connectez vos comptes Gmail pour envoyer des emails depuis le CRM.
      </p>
      {syncResult && (
        <p className={`text-xs mb-3 ${syncResult.includes('Erreur') ? 'text-accent-danger' : 'text-accent-success'}`}>
          {syncResult}
        </p>
      )}

      <div className="space-y-3 mt-4">
        {accounts.map(account => (
          <div key={account.id} className="rounded-lg border border-border-color-subtle overflow-hidden">
            <div className="flex items-center justify-between bg-bg-base px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-accent-success flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{account.label}</p>
                  {account.email && <p className="text-xs text-text-secondary">{account.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleSig(account.id, account.signature)}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
                >
                  Signature
                  {expandedSig === account.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => handleConnect(account.label)}
                  disabled={connecting === account.label}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-white/5"
                >
                  {connecting === account.label ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reconnecter'}
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  disabled={deleting === account.id}
                  className="w-7 h-7 rounded-lg hover:bg-accent-danger/10 flex items-center justify-center transition-colors"
                >
                  {deleting === account.id
                    ? <Loader2 className="w-3 h-3 animate-spin text-accent-danger" />
                    : <Trash2 className="w-3 h-3 text-accent-danger" />}
                </button>
              </div>
            </div>

            {expandedSig === account.id && (
              <div className="px-4 py-3 border-t border-border-color-subtle bg-bg-base/50 space-y-2">
                <p className="text-xs text-text-secondary">Signature automatique ajoutée à chaque email envoyé depuis ce compte.</p>
                <textarea
                  rows={4}
                  value={sigDraft[account.id] ?? ''}
                  onChange={e => setSigDraft(prev => ({ ...prev, [account.id]: e.target.value }))}
                  placeholder={`Cordialement,\n${account.label}\nIrys Agency`}
                  className="w-full bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors resize-none font-mono"
                />
                <button
                  onClick={() => saveSig(account.id)}
                  disabled={savingSig === account.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
                >
                  {savingSig === account.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Sauvegarder
                </button>
              </div>
            )}
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="flex items-center gap-3 text-sm text-text-secondary py-2">
            <Mail className="w-4 h-4" />
            Aucun compte connecté
          </div>
        )}
      </div>

      <div className="mt-4">
        {showForm ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nom du compte (ex: Quentin)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNew()}
              autoFocus
              className="flex-1 bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-violet transition-colors"
            />
            <button
              onClick={handleAddNew}
              disabled={!newLabel.trim() || !!connecting}
              className="px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connecter'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewLabel('') }}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-text-secondary transition-colors"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un compte Gmail
          </button>
        )}
      </div>
    </div>
  )
}
