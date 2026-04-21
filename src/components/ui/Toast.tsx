'use client'

import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import type { Toast, ToastType } from '@/hooks/useToast'

const STYLES: Record<ToastType, { icon: React.ReactNode; bar: string }> = {
  success: { icon: <CheckCircle className="w-4 h-4 text-accent-success flex-shrink-0" />, bar: 'bg-accent-success' },
  error:   { icon: <XCircle    className="w-4 h-4 text-accent-danger flex-shrink-0"  />, bar: 'bg-accent-danger'  },
  info:    { icon: <Info       className="w-4 h-4 text-accent-violet flex-shrink-0"  />, bar: 'bg-accent-violet'  },
}

interface ToasterProps {
  toasts: Toast[]
  dismiss: (id: string) => void
}

export function Toaster({ toasts, dismiss }: ToasterProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 bg-bg-sidebar border border-border-color-subtle rounded-xl shadow-2xl shadow-black/50 overflow-hidden min-w-[280px] max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          <div className={`w-1 self-stretch ${STYLES[t.type].bar}`} />
          <div className="flex items-center gap-2 py-3 pr-2 flex-1">
            {STYLES[t.type].icon}
            <p className="text-sm text-text-primary flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-text-secondary hover:text-text-primary transition-colors ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
