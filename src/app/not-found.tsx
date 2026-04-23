import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[64px] font-semibold text-[#E5E7EB] font-mono leading-none">404</div>
        <h1 className="text-[18px] font-semibold text-[#111316] mt-4">Page introuvable</h1>
        <p className="text-[13px] text-[#8A8F97] mt-1">Cette page n&apos;existe pas.</p>
        <Link
          href="/"
          className="inline-block mt-6 px-4 py-2 bg-[#111316] text-white text-[12px] font-medium rounded-[8px] hover:bg-[#474B52] transition-colors"
        >
          ← Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
