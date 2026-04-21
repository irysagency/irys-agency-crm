'use client'

import { useState } from 'react'
import { Download, Loader2, Check, ChevronDown } from 'lucide-react'
import type { NicheType } from '@/types'
import { NICHES } from '@/types'

interface EmailAccount {
  id: string
  label: string
  email: string | null
}

interface SentContact {
  email: string
  name: string
  emailCount: number
  lastSent: string
  threads: { subject: string; date: string; threadId: string }[]
}

interface SelectableContact extends SentContact {
  selected: boolean
  niche: NicheType | ''
}

interface GmailImportProps {
  accounts: EmailAccount[]
}

export function GmailImport({ accounts }: GmailImportProps) {
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? '')
  const [contacts, setContacts] = useState<SelectableContact[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (accounts.length === 0) return null

  async function handleSync() {
    setLoading(true)
    setError(null)
    setDone(false)
    setContacts([])
    try {
      const res = await fetch(`/api/gmail/sync?accountId=${selectedAccount}`)
      const data = await res.json() as { contacts?: SentContact[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur sync')
      setContacts((data.contacts ?? []).map(c => ({ ...c, selected: false, niche: '' })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  function toggleAll(val: boolean) {
    setContacts(prev => prev.map(c => ({ ...c, selected: val })))
  }

  function toggle(email: string) {
    setContacts(prev => prev.map(c => c.email === email ? { ...c, selected: !c.selected } : c))
  }

  function setNiche(email: string, niche: NicheType) {
    setContacts(prev => prev.map(c => c.email === email ? { ...c, niche } : c))
  }

  async function handleImport() {
    const toImport = contacts.filter(c => c.selected && c.niche)
    if (toImport.length === 0) return
    setImporting(true)
    setError(null)
    try {
      const res = await fetch('/api/gmail/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: toImport.map(c => ({ ...c, accountId: selectedAccount })),
        }),
      })
      const data = await res.json() as { imported?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur import')
      setDone(true)
      setContacts([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = contacts.filter(c => c.selected).length
  const readyToImport = contacts.filter(c => c.selected && c.niche).length

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-xl p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Importer depuis Gmail</h3>
      <p className="text-xs text-text-secondary mb-4">
        Récupère les personnes que vous avez déjà contactées depuis Gmail.
      </p>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <select
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            className="w-full appearance-none bg-bg-base border border-border-color-subtle rounded-lg px-3 py-2 pr-8 text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.label}{a.email ? ` — ${a.email}` : ''}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>
        <button
          onClick={handleSync}
          disabled={loading || !selectedAccount}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? 'Chargement...' : 'Analyser'}
        </button>
      </div>

      {done && (
        <div className="flex items-center gap-2 text-sm text-accent-success py-2">
          <Check className="w-4 h-4" /> Import réussi — rechargez la page Prospects
        </div>
      )}

      {error && <p className="text-xs text-accent-danger mb-3">{error}</p>}

      {contacts.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-secondary">{contacts.length} contacts trouvés non importés</p>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="text-xs text-accent-violet hover:underline">Tout sélectionner</button>
              <span className="text-text-secondary text-xs">·</span>
              <button onClick={() => toggleAll(false)} className="text-xs text-text-secondary hover:underline">Désélectionner</button>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {contacts.map(c => (
              <div
                key={c.email}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  c.selected ? 'border-accent-violet/40 bg-accent-violet/5' : 'border-border-color-subtle bg-bg-base'
                }`}
                onClick={() => toggle(c.email)}
              >
                <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                  c.selected ? 'border-accent-violet bg-accent-violet' : 'border-text-secondary'
                }`}>
                  {c.selected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{c.name || c.email}</p>
                  <p className="text-xs text-text-secondary truncate">{c.email} · {c.emailCount} email{c.emailCount > 1 ? 's' : ''} envoyé{c.emailCount > 1 ? 's' : ''}</p>
                </div>
                {c.selected && (
                  <div onClick={e => e.stopPropagation()}>
                    <select
                      value={c.niche}
                      onChange={e => setNiche(c.email, e.target.value as NicheType)}
                      className="bg-bg-sidebar border border-border-color-subtle rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-violet"
                    >
                      <option value="">Niche...</option>
                      {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedCount > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-text-secondary">
                {readyToImport}/{selectedCount} prêts à importer
                {readyToImport < selectedCount && ' (niche manquante)'}
              </p>
              <button
                onClick={handleImport}
                disabled={importing || readyToImport === 0}
                className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {importing ? 'Import...' : `Importer ${readyToImport} prospect${readyToImport > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
