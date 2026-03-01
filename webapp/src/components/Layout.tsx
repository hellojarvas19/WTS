// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT COMPONENT - Mobile-Optimized 3D Glassmorphism Navigation
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Wallet, 
  Settings, 
  Menu, 
  X,
  TrendingUp,
  Zap,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  currentPage: 'tracker' | 'wallets' | 'settings'
  onPageChange: (page: 'tracker' | 'wallets' | 'settings') => void
}

const navItems = [
  { id: 'tracker' as const, label: 'Tracker', icon: Activity },
  { id: 'wallets' as const, label: 'Wallets', icon: Wallet },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
]

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when page changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [currentPage, isMobile])

  return (
    <div className="min-h-screen bg-black">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-radial from-plasma-800/20 to-transparent rounded-full blur-3xl float-3d-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-80 md:h-80 bg-gradient-radial from-plasma-700/15 to-transparent rounded-full blur-3xl float-3d" style={{ animationDelay: '-3s' }} />
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>

      {/* Mobile Header - Fixed */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-pane border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-plasma-300 to-plasma-500 flex items-center justify-center glow-plasma-sm">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-bold text-base glow-text">Solana Tracker</span>
              <div className="flex items-center gap-1 text-[10px] text-plasma-400">
                <Zap className="w-2.5 h-2.5" />
                <span>Live</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-10 w-10 glass-button rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Sidebar - Mobile: Full screen overlay, Desktop: Fixed */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-40 w-[280px] lg:w-72 transition-all duration-300 ease-out",
            sidebarOpen 
              ? "translate-x-0" 
              : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className={cn(
            "h-full glass-pane border-r border-white/10 overflow-hidden",
            "lg:m-0 lg:rounded-none",
            isMobile ? "m-0 rounded-none" : "m-4 rounded-2xl"
          )}>
            {/* Logo - Desktop Only */}
            <div className="hidden lg:flex flex-col p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-plasma-200 via-plasma-400 to-plasma-600 flex items-center justify-center glow-plasma">
                    <TrendingUp className="w-5 h-5 text-black" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                </div>
                <div>
                  <h1 className="font-bold text-lg glow-text tracking-tight">Solana Tracker</h1>
                  <div className="flex items-center gap-1.5 text-[10px] text-plasma-400 mt-0.5">
                    <Zap className="w-3 h-3 text-green-400" />
                    <span>Real-time monitoring</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1 lg:p-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={cn(
                      "w-full group relative flex items-center gap-3 px-3 py-3 lg:px-4 lg:py-3.5 rounded-xl text-sm font-medium transition-all duration-300",
                      "active:scale-[0.98]",
                      isActive
                        ? "glass-80 border-glow"
                        : "hover:glass-40 border border-transparent"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 lg:h-8 bg-gradient-to-b from-plasma-300 to-plasma-500 rounded-r-full glow-plasma-sm" />
                    )}
                    
                    <div className={cn(
                      "w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0",
                      isActive 
                        ? "bg-gradient-to-br from-plasma-400 to-plasma-600 text-black shadow-lg shadow-plasma-500/30" 
                        : "bg-white/5 text-plasma-400 group-hover:bg-white/10 group-hover:text-plasma-200"
                    )}>
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    
                    <span className={cn(
                      "flex-1 text-left transition-colors text-sm lg:text-base",
                      isActive ? "text-white glow-text" : "text-plasma-300 group-hover:text-white"
                    )}>
                      {item.label}
                    </span>
                    
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all duration-300 shrink-0",
                      isActive 
                        ? "text-plasma-400 translate-x-0 opacity-100" 
                        : "text-plasma-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    )} />
                  </button>
                )
              })}
            </nav>

            {/* Footer Stats */}
            <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 border-t border-white/5">
              <div className="glass-40 rounded-lg p-2.5 lg:p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] lg:text-xs">
                  <span className="text-plasma-500">Network</span>
                  <span className="text-plasma-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Mainnet
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] lg:text-xs">
                  <span className="text-plasma-500">Status</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="h-px bg-white/5 my-1.5" />
                <div className="text-[9px] lg:text-[10px] text-plasma-600 text-center">
                  Solana Tracker v1.0
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 min-h-screen">
          {/* Mobile: Add padding for fixed header */}
          <div className="pt-16 lg:pt-0 p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-pane border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 active:scale-95",
                  isActive 
                    ? "text-white" 
                    : "text-plasma-500"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? "bg-gradient-to-br from-plasma-400 to-plasma-600 text-black shadow-lg shadow-plasma-500/30" 
                    : "bg-white/5"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-white" : "text-plasma-500"
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile: Add padding for bottom nav */}
      <div className="lg:hidden h-20" />
    </div>
  )
}
