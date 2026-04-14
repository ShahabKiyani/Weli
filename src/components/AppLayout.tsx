import type { ReactNode } from 'react'
import { NavBar } from '@/components/NavBar'

export interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      {/* T-068: Skip link — visible only on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <NavBar />

      {/* T-065: fade-in animation on every page mount */}
      {/* T-068: id + tabIndex=-1 so the skip link can focus here */}
      <main
        id="main-content"
        tabIndex={-1}
        className="max-w-3xl mx-auto px-4 py-6 pb-20 animate-fade-in outline-none"
      >
        {children}
      </main>
    </div>
  )
}
