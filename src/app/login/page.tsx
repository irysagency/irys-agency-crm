'use client'

import { useState, type FormEvent } from 'react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        window.location.href = '/'
      } else {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Erreur de connexion')
      }
    } catch {
      setError('Erreur réseau, veuillez réessayer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F4F5F7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: 32,
        }}
      >
        {/* Logo + titre */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 36,
              height: 36,
              backgroundColor: '#111316',
              color: '#FFFFFF',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 12,
              fontFamily: 'Inter Tight, Inter, sans-serif',
            }}
          >
            I
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111316', fontFamily: 'Inter Tight, Inter, sans-serif', letterSpacing: '-0.01em' }}>
            Irys CRM
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#8A8F97',
              marginTop: 3,
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            Prospection · Irys Agency
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 500,
                color: '#474B52',
                marginBottom: 6,
                fontFamily: 'Inter Tight, Inter, sans-serif',
              }}
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
              style={{
                width: '100%',
                backgroundColor: '#F4F5F7',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: '#111316',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'Inter Tight, Inter, sans-serif',
                transition: 'border-color 150ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'oklch(0.62 0.14 155)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || password.length === 0}
            style={{
              width: '100%',
              padding: '10px 0',
              backgroundColor: loading ? '#474B52' : '#111316',
              color: '#FFFFFF',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: loading || password.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter Tight, Inter, sans-serif',
              opacity: password.length === 0 ? 0.6 : 1,
              transition: 'background-color 150ms ease, opacity 150ms ease',
            }}
          >
            {loading ? 'Connexion…' : 'Accéder au CRM'}
          </button>

          {error !== null && (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'oklch(0.62 0.18 25)',
                textAlign: 'center',
                fontFamily: 'Inter Tight, Inter, sans-serif',
              }}
            >
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
