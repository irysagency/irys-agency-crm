'use client'

import { useState } from 'react'
import { Eye, Clock, ChevronDown, ChevronUp, MessageSquare, Loader2, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Email } from '@/types'
import type { ThreadMessage } from '@/app/api/gmail/thread/route'

interface EmailHistoryProps {
  emails: Email[]
  loading?: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function EmailItem({ email }: { email: Email }) {
  const [expanded, setExpanded]           = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [thread, setThread]               = useState<ThreadMessage[] | null>(null)
  const [threadError, setThreadError]     = useState<string | null>(null)

  async function loadThread() {
    if (!email.gmail_thread_id) return
    setLoadingThread(true)
    setThreadError(null)
    try {
      const res = await fetch(
        `/api/gmail/thread?threadId=${encodeURIComponent(email.gmail_thread_id)}&emailId=${encodeURIComponent(email.id)}`
      )
      const data = await res.json() as { messages?: ThreadMessage[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setThread(data.messages ?? [])
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : 'Impossible de charger le thread')
    } finally {
      setLoadingThread(false)
    }
  }

  const hasReply = email.a_recu_reponse

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      {/* Header email */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-1 text-left"
          >
            <p className="text-sm font-medium text-[#111316] hover:text-[oklch(0.62_0.14_155)] transition-colors">
              {email.objet}
            </p>
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasReply && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[oklch(0.95_0.04_155)] text-[oklch(0.62_0.14_155)] rounded-full text-[10px] font-semibold">
                <MessageSquare className="w-2.5 h-2.5" />
                Réponse
              </span>
            )}
            {email.ouvert && (
              <span className="inline-flex items-center gap-1 text-xs text-[oklch(0.72_0.14_75)]">
                <Eye className="w-3 h-3" />
                {email.nb_ouvertures}×
              </span>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-[#8A8F97] hover:text-[#474B52] transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#8A8F97]">
          <Clock className="w-3 h-3" />
          <span>{formatDate(email.envoye_le)}</span>
        </div>
      </div>

      {/* Corps email expandable — CSS transition, no framer-motion */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: expanded ? 2000 : 0,
          transition: 'max-height 250ms ease',
        }}
      >
        <div className="border-t border-[#E5E7EB] px-4 py-3">
          <pre className="text-xs text-[#474B52] whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
            {email.corps}
          </pre>
        </div>

        {/* Bouton charger thread Gmail */}
        {email.gmail_thread_id && !thread && (
          <div className="px-4 pb-3">
            <button
              onClick={loadThread}
              disabled={loadingThread}
              className="flex items-center gap-2 text-xs text-[oklch(0.62_0.14_155)] hover:text-[oklch(0.56_0.14_155)] transition-colors disabled:opacity-50"
            >
              {loadingThread
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <MessageSquare className="w-3 h-3" />
              }
              {loadingThread ? 'Chargement...' : 'Voir les réponses Gmail'}
            </button>
          </div>
        )}
        {threadError && (
          <p className="text-xs text-red-500 px-4 pb-2">{threadError}</p>
        )}

        {/* Thread messages */}
        {thread && thread.length > 0 && (
          <div className="border-t border-[#E5E7EB] divide-y divide-[#E5E7EB]">
            {thread.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`px-4 py-3 ${msg.isOutgoing ? 'bg-[#FAFBFC]' : 'bg-[oklch(0.97_0.02_155)]'}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {i > 0 && <ArrowRight className="w-3 h-3 text-[#D6D9DE]" />}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    msg.isOutgoing
                      ? 'bg-[#F4F5F7] text-[#474B52]'
                      : 'bg-[oklch(0.95_0.04_155)] text-[oklch(0.62_0.14_155)]'
                  }`}>
                    {msg.isOutgoing ? 'Vous' : 'Eux'}
                  </span>
                  <span className="text-[10px] text-[#8A8F97]">
                    {formatDate(msg.date)}
                  </span>
                </div>
                <pre className="text-xs text-[#474B52] whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                  {msg.body || msg.snippet}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function EmailHistory({ emails, loading = false }: EmailHistoryProps) {
  if (loading) return <Skeleton className="h-32 w-full" />
  if (emails.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-semibold text-[#8A8F97] uppercase tracking-wider font-mono mb-3">
        Historique des échanges ({emails.length})
      </h4>
      <div className="space-y-2">
        {emails.map(email => (
          <EmailItem key={email.id} email={email} />
        ))}
      </div>
    </div>
  )
}
