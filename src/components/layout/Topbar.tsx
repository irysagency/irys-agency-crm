import { TopbarTitle } from './TopbarTitle'

export function Topbar() {
  return (
    <header className="h-16 border-b border-border-color-subtle bg-bg-sidebar/50 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-30">
      <div className="flex-1">
        <TopbarTitle />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent-violet/20 flex items-center justify-center text-xs font-semibold text-accent-violet">
          IA
        </div>
      </div>
    </header>
  )
}
