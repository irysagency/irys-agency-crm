'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface EmailAccount {
  id: string
  label: string
  email: string | null
  signature?: string | null
}

interface SettingsClientProps {
  accounts: EmailAccount[]
  delays: { delaiEnvoye: number; delaiOuvert: number }
}

type Tab = 'comptes' | 'import' | 'delais' | 'templates' | 'equipe'

const TABS: { k: Tab; label: string; icon: string }[] = [
  { k: 'comptes',   label: 'Comptes Gmail',     icon: '✉' },
  { k: 'import',    label: 'Import',             icon: '↓' },
  { k: 'delais',    label: 'Délais de relance',  icon: '◷' },
  { k: 'templates', label: 'Templates',          icon: '📄' },
  { k: 'equipe',    label: 'Équipe',             icon: '◱' },
]

export function SettingsClient({ accounts: initialAccounts, delays }: SettingsClientProps) {
  const [tab, setTab] = useState<Tab>('comptes')

  // Gmail accounts state
  const [accounts, setAccounts]     = useState<EmailAccount[]>(initialAccounts)
  const [syncing, setSyncing]       = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newLabel, setNewLabel]     = useState('')
  const [expandedSig, setExpandedSig] = useState<string | null>(null)
  const [sigDraft, setSigDraft]     = useState<Record<string, string>>({})
  const [savingSig, setSavingSig]   = useState<string | null>(null)

  // Import state
  const [importAccount, setImportAccount] = useState(initialAccounts[0]?.id ?? '')
  const [analyzing, setAnalyzing]   = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // Delays state
  const [delaiEnvoye, setDelaiEnvoye] = useState(delays.delaiEnvoye)
  const [delaiOuvert, setDelaiOuvert] = useState(delays.delaiOuvert)
  const [savingDelays, setSavingDelays] = useState(false)
  const [savedDelays, setSavedDelays]   = useState(false)
  const [delayError, setDelayError]     = useState<string | null>(null)

  function handleConnect(label: string) {
    setConnecting(label)
    window.location.href = `/api/gmail/auth?label=${encodeURIComponent(label)}`
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
      setSyncResult(err instanceof Error ? err.message : 'Erreur inconnue')
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

  async function handleSaveDelays() {
    setSavingDelays(true)
    setSavedDelays(false)
    setDelayError(null)
    try {
      const res = await fetch('/api/settings/relance-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delaiEnvoye, delaiOuvert }),
      })
      if (!res.ok) throw new Error('Erreur sauvegarde')
      setSavedDelays(true)
      setTimeout(() => setSavedDelays(false), 2000)
    } catch (err) {
      setDelayError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSavingDelays(false)
    }
  }

  async function handleAnalyze() {
    if (!importAccount) return
    setAnalyzing(true)
    setAnalyzeResult(null)
    setAnalyzeError(null)
    try {
      const res = await fetch('/api/gmail/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: importAccount }),
      })
      const data = await res.json() as { imported?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur import')
      setAnalyzeResult(data.imported === 0
        ? 'Aucun nouveau prospect trouvé'
        : `${data.imported} prospect${(data.imported ?? 0) > 1 ? 's' : ''} importé${(data.imported ?? 0) > 1 ? 's' : ''}`)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      {/* Top bar */}
      <div className="px-8 py-[18px] border-b border-[#E5E7EB] bg-white flex-shrink-0">
        <div className="text-[11px] text-[#8A8F97] font-mono uppercase tracking-[0.08em]">Irys CRM · Configuration</div>
        <div className="text-[18px] font-semibold tracking-[-0.01em] text-[#111316] mt-0.5">Paramètres</div>
      </div>

      {/* Tab nav */}
      <div className="px-8 bg-white border-b border-[#E5E7EB] flex gap-1 flex-shrink-0">
        {TABS.map(tb => {
          const active = tb.k === tab
          return (
            <button
              key={tb.k}
              onClick={() => setTab(tb.k)}
              className="flex items-center gap-[7px] px-[14px] py-[12px] text-[12px] transition-colors"
              style={{
                fontWeight: active ? 600 : 500,
                color: active ? '#111316' : '#8A8F97',
                borderBottom: `2px solid ${active ? '#111316' : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              <span className="text-[13px]">{tb.icon}</span>
              {tb.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-[820px] mx-auto flex flex-col gap-[14px]">

          {/* ── Comptes Gmail ── */}
          {tab === 'comptes' && (
            <section className="bg-white border border-[#E5E7EB] rounded-[12px]">
              <div className="px-[22px] py-[18px] border-b border-[#E5E7EB] flex justify-between items-start">
                <div>
                  <div className="text-[14px] font-semibold text-[#111316]">Comptes Gmail</div>
                  <div className="text-[12px] text-[#8A8F97] mt-[3px]">Connectez vos comptes Gmail pour envoyer des emails depuis le CRM</div>
                </div>
                <button
                  onClick={handleSyncReplies}
                  disabled={syncing}
                  className="flex items-center gap-[6px] px-[12px] py-[7px] bg-white border border-[#E5E7EB] rounded-[8px] text-[11px] font-medium text-[#474B52] hover:bg-[#F4F5F7] disabled:opacity-50 transition-colors"
                >
                  {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {syncing ? 'Vérification...' : '⟲ Sync réponses'}
                </button>
              </div>
              {syncResult && (
                <div className="px-[22px] pt-3 text-[12px]" style={{ color: syncResult.includes('Erreur') ? 'oklch(0.62 0.18 25)' : 'oklch(0.62 0.14 155)' }}>
                  {syncResult}
                </div>
              )}
              <div className="px-[22px] py-[14px] flex flex-col gap-2">
                {accounts.map(account => (
                  <div key={account.id} className="border border-[#E5E7EB] rounded-[10px] overflow-hidden">
                    <div className="flex items-center gap-3 px-[14px] py-[12px] bg-[#FAFBFC]">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                        style={{ background: 'oklch(0.95 0.04 155)', color: 'oklch(0.62 0.14 155)' }}
                      >
                        ✓
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#111316]">{account.label}</div>
                        {account.email && (
                          <div className="text-[11px] font-mono text-[#8A8F97] mt-[2px]">{account.email}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleSig(account.id, account.signature)}
                          className="flex items-center gap-[4px] px-[10px] py-[5px] bg-white border border-[#E5E7EB] rounded-[6px] text-[11px] text-[#474B52] hover:bg-[#F4F5F7] transition-colors"
                        >
                          Signature <span className="text-[#8A8F97]">▾</span>
                        </button>
                        <button
                          onClick={() => handleConnect(account.label)}
                          disabled={connecting === account.label}
                          className="px-[10px] py-[5px] bg-white border border-[#E5E7EB] rounded-[6px] text-[11px] text-[#474B52] hover:bg-[#F4F5F7] disabled:opacity-50 transition-colors"
                        >
                          {connecting === account.label ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reconnecter'}
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={deleting === account.id}
                          className="w-7 h-7 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-[6px] text-[12px] text-[#8A8F97] hover:text-[oklch(0.62_0.18_25)] hover:border-[oklch(0.62_0.18_25)] disabled:opacity-50 transition-colors"
                        >
                          {deleting === account.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '🗑'}
                        </button>
                      </div>
                    </div>
                    {expandedSig === account.id && (
                      <div className="px-[14px] py-3 border-t border-[#E5E7EB] bg-white flex flex-col gap-2">
                        <div className="text-[12px] text-[#8A8F97]">Signature automatique ajoutée à chaque email envoyé depuis ce compte.</div>
                        <textarea
                          rows={3}
                          value={sigDraft[account.id] ?? ''}
                          onChange={e => setSigDraft(prev => ({ ...prev, [account.id]: e.target.value }))}
                          placeholder={`Cordialement,\n${account.label}\nIrys Agency`}
                          className="w-full bg-[#F4F5F7] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[12px] font-mono text-[#111316] placeholder-[#8A8F97] focus:outline-none focus:border-[oklch(0.62_0.14_155)] resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => saveSig(account.id)}
                            disabled={savingSig === account.id}
                            className="flex items-center gap-1.5 px-3 py-[7px] bg-[#111316] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#474B52] disabled:opacity-50 transition-colors"
                          >
                            {savingSig === account.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            Sauvegarder
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {accounts.length === 0 && (
                  <div className="text-[13px] text-[#8A8F97] py-2">Aucun compte connecté</div>
                )}

                {showNewForm ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Nom du compte (ex: Quentin)"
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && newLabel.trim()) handleConnect(newLabel.trim()) }}
                      autoFocus
                      className="flex-1 bg-[#F4F5F7] border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[13px] text-[#111316] placeholder-[#8A8F97] focus:outline-none focus:border-[oklch(0.62_0.14_155)]"
                    />
                    <button
                      onClick={() => newLabel.trim() && handleConnect(newLabel.trim())}
                      disabled={!newLabel.trim() || !!connecting}
                      className="px-4 py-2 bg-[#111316] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#474B52] disabled:opacity-50 transition-colors"
                    >
                      {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connecter'}
                    </button>
                    <button
                      onClick={() => { setShowNewForm(false); setNewLabel('') }}
                      className="px-3 py-2 bg-[#F4F5F7] text-[#474B52] rounded-[8px] text-[12px] hover:bg-[#E5E7EB] transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="w-full py-[11px] bg-white border border-dashed border-[#D6D9DE] rounded-[10px] text-[12px] font-medium text-[#474B52] hover:bg-[#F4F5F7] transition-colors"
                  >
                    + Ajouter un compte Gmail
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ── Import ── */}
          {tab === 'import' && (
            <>
              <section className="bg-white border border-[#E5E7EB] rounded-[12px]">
                <div className="px-[22px] py-[18px] border-b border-[#E5E7EB]">
                  <div className="text-[14px] font-semibold text-[#111316]">Importer depuis Gmail</div>
                  <div className="text-[12px] text-[#8A8F97] mt-[3px]">Récupérer les personnes que vous avez déjà contactées depuis Gmail</div>
                </div>
                <div className="px-[22px] py-[18px] flex gap-2">
                  <div className="flex-1 flex items-center justify-between px-3 py-[9px] border border-[#E5E7EB] rounded-[8px] bg-[#FAFBFC] text-[12px]">
                    <select
                      value={importAccount}
                      onChange={e => setImportAccount(e.target.value)}
                      className="flex-1 bg-transparent text-[#474B52] outline-none text-[12px]"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.label} — {a.email}</option>
                      ))}
                      {accounts.length === 0 && <option value="">Aucun compte connecté</option>}
                    </select>
                  </div>
                  <button
                    disabled={!importAccount || analyzing}
                    onClick={handleAnalyze}
                    className="px-[16px] py-[9px] bg-[#111316] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#474B52] disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    ↓ Analyser
                  </button>
                </div>
                {analyzeResult && (
                  <div className="px-[22px] pb-[14px] text-[12px]" style={{ color: 'oklch(0.62 0.14 155)' }}>
                    {analyzeResult}
                  </div>
                )}
                {analyzeError && (
                  <div className="px-[22px] pb-[14px] text-[12px]" style={{ color: 'oklch(0.62 0.18 25)' }}>
                    {analyzeError}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ── Délais ── */}
          {tab === 'delais' && (
            <section className="bg-white border border-[#E5E7EB] rounded-[12px]">
              <div className="px-[22px] py-[18px] border-b border-[#E5E7EB]">
                <div className="text-[14px] font-semibold text-[#111316]">Délais de relance</div>
                <div className="text-[12px] text-[#8A8F97] mt-[3px]">Un prospect apparaît dans les relances quand sa dernière action date de plus de N jours</div>
              </div>
              <div className="px-[22px] py-[18px]">
                <div className="grid grid-cols-2 gap-[14px]">
                  {[
                    {
                      label: 'Statut Envoyé',
                      sub: "(pas d'ouverture)",
                      dot: 'oklch(0.58 0.14 245)',
                      value: delaiEnvoye,
                      set: setDelaiEnvoye,
                    },
                    {
                      label: 'Statut Ouvert',
                      sub: '(pas de réponse)',
                      dot: 'oklch(0.72 0.14 75)',
                      value: delaiOuvert,
                      set: setDelaiOuvert,
                    },
                  ].map((d, i) => (
                    <div key={i} className="border border-[#E5E7EB] rounded-[10px] bg-[#FAFBFC] p-[14px_16px]">
                      <div className="flex items-center gap-[7px] mb-[10px]">
                        <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: d.dot }} />
                        <span className="text-[12px] font-semibold text-[#111316]">{d.label}</span>
                        <span className="text-[11px] text-[#8A8F97]">{d.sub}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={d.value}
                          onChange={e => d.set(Math.max(1, Math.min(60, Number(e.target.value))))}
                          className="w-20 text-center text-[18px] font-semibold font-mono text-[#111316] border border-[#E5E7EB] rounded-[8px] px-3 py-2 bg-white focus:outline-none focus:border-[oklch(0.62_0.14_155)]"
                        />
                        <span className="text-[12px] text-[#474B52]">jours sans action → relance</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end items-center gap-3 mt-[14px]">
                  {savedDelays && (
                    <span className="text-[12px]" style={{ color: 'oklch(0.62 0.14 155)' }}>Sauvegardé ✓</span>
                  )}
                  {delayError && (
                    <span className="text-[12px]" style={{ color: 'oklch(0.62 0.18 25)' }}>{delayError}</span>
                  )}
                  <button
                    onClick={() => { setDelaiEnvoye(delays.delaiEnvoye); setDelaiOuvert(delays.delaiOuvert) }}
                    className="px-[14px] py-[8px] bg-white border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#474B52] hover:bg-[#F4F5F7] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveDelays}
                    disabled={savingDelays}
                    className="flex items-center gap-1.5 px-[14px] py-[8px] bg-[#111316] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#474B52] disabled:opacity-50 transition-colors"
                  >
                    {savingDelays ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    ✓ Enregistrer
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── Templates ── */}
          {tab === 'templates' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-[14px] font-semibold text-[#111316]">Templates</div>
              <div className="text-[13px] text-[#8A8F97] mt-1">Bientôt disponible</div>
            </div>
          )}

          {/* ── Équipe ── */}
          {tab === 'equipe' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-[14px] font-semibold text-[#111316]">Équipe</div>
              <div className="text-[13px] text-[#8A8F97] mt-1">Bientôt disponible</div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
