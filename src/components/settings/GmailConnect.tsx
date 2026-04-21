'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface GmailConnectProps {
  isConnected: boolean
}

export function GmailConnect({ isConnected }: GmailConnectProps) {
  const [loading, setLoading] = useState(false)

  function handleConnect() {
    setLoading(true)
    window.location.href = '/api/gmail/auth'
  }

  return (
    <div className="bg-bg-card border border-border-color-subtle rounded-xl p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Compte Gmail</h3>
      <p className="text-xs text-text-secondary mb-4">
        Connectez votre compte Gmail pour envoyer des emails directement depuis le CRM.
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4 text-accent-success" />
              <span className="text-sm text-accent-success font-medium">Connecté</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-accent-warning" />
              <span className="text-sm text-text-secondary">Non connecté</span>
            </>
          )}
        </div>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isConnected ? 'Reconnecter' : 'Connecter Gmail'}
        </button>
      </div>
    </div>
  )
}
