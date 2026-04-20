'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: string
}

export function Drawer({ open, onClose, title, children, width = 'w-[560px]' }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={clsx(
          'fixed right-0 top-0 h-screen bg-bg-sidebar border-l border-border-color-subtle z-50',
          'flex flex-col transition-transform duration-200',
          width,
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-color-subtle">
            <h2 className="font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
