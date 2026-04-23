import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Irys CRM',
  description: 'CRM de prospection Irys Agency',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-[#F4F5F7] text-[#111316] min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-16 overflow-auto">
          {children}
        </div>
      </body>
    </html>
  )
}
