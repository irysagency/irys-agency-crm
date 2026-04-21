'use client'

import { useEffect, useState } from 'react'
import { Eye, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'
import type { Email } from '@/types'

interface EmailHistoryProps {
  prospectId: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EmailHistory({ prospectId }: EmailHistoryProps) {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('emails')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('envoye_le', { ascending: true })
      .then(({ data }) => {
        if (data) setEmails(data as Email[])
        setLoading(false)
      })
  }, [prospectId])

  if (loading) return <Skeleton className="h-32 w-full" />
  if (emails.length === 0) return null

  return (
    <div>
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Historique des échanges
      </h4>
      <div className="space-y-3">
        {emails.map(email => (
          <div key={email.id} className="bg-bg-base rounded-lg p-4 border border-border-color-subtle">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-medium text-text-primary">{email.objet}</p>
              {email.ouvert && (
                <div className="flex items-center gap-1 text-xs text-accent-warning flex-shrink-0 ml-2">
                  <Eye className="w-3 h-3" />
                  <span>{email.nb_ouvertures}×</span>
                </div>
              )}
            </div>
            <p className="text-xs text-text-secondary mb-2 line-clamp-3">{email.corps}</p>
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <Clock className="w-3 h-3" />
              <span>{formatDate(email.envoye_le)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
