// ═══════════════════════════════════════════════════════════════════════════════
// TRACKER PAGE - Mobile-Optimized 3D Glassmorphism Real-time Wallet Tracking
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { 
  Activity, 
  RefreshCw, 
  Wallet,
  Bell,
  Filter,
  Search,
  Radio,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { WalletCard } from '@/components/WalletCard'
import { useWalletStore } from '@/store/walletStore'
import { useRealTimeTracking } from '@/hooks/useRealTimeTracking'

export function TrackerPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const wallets = useWalletStore(state => state.wallets)
  const walletData = useWalletStore(state => state.walletData)
  const fetchAllTransactions = useWalletStore(state => state.fetchAllTransactions)
  const isFetchingTransactions = useWalletStore(state => state.isFetchingTransactions)
  
  // Real-time tracking
  const { isConnected, isConnecting } = useRealTimeTracking()
  
  // Initial fetch
  useEffect(() => {
    if (wallets.length > 0) {
      fetchAllTransactions(10)
    }
  }, [])
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllTransactions(10)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [fetchAllTransactions])
  
  // Filter wallets
  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch = 
      wallet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.address.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'active' ? wallet.isActive :
      !wallet.isActive
    
    return matchesSearch && matchesFilter
  })
  
  // Get active wallets count
  const activeWalletsCount = wallets.filter(w => w.isActive).length
  
  // Get total transactions count
  const totalTransactions = Array.from(walletData.values()).reduce(
    (sum, data) => sum + data.transactions.length, 
    0
  )
  
  // Get new transactions count
  const newTransactionsCount = Array.from(walletData.values()).reduce(
    (sum, data) => sum + data.transactions.filter(t => t.isNew).length,
    0
  )

  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-8">
      {/* Header - Glass Card */}
      <div className="glass-card p-4 lg:p-6 holographic">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-plasma-300 to-plasma-500 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 lg:w-5 lg:h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl lg:text-3xl font-bold glow-text">Tracker</h1>
                <p className="text-plasma-500 text-xs lg:text-sm hidden sm:block">
                  Real-time monitoring of <span className="text-white font-medium">{wallets.length}</span> wallet{wallets.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Refresh Button - Desktop */}
            <Button
              onClick={() => fetchAllTransactions(10)}
              disabled={isFetchingTransactions}
              className="hidden sm:flex glass-button gap-2 text-plasma-200 hover:text-white"
            >
              <RefreshCw className={cn(
                "w-4 h-4",
                isFetchingTransactions && "animate-spin"
              )} />
              <span className="hidden lg:inline">Refresh All</span>
            </Button>
          </div>
          
          {/* Stats Row - Mobile/Tablet */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Connection Status */}
            <div className={cn(
              "glass-60 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5",
              isConnected ? "border-green-500/20" : "border-yellow-500/20"
            )}>
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
              )}
              <span className={cn(
                "text-xs",
                isConnected ? "text-green-400" : "text-yellow-400"
              )}>
                {isConnecting ? 'Connecting...' : isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <div className="glass-60 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-plasma-400" />
              <span className="text-xs">
                <span className="text-white font-medium">{activeWalletsCount}</span>
                <span className="text-plasma-500 ml-1">Active</span>
              </span>
            </div>
            <div className="glass-60 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-plasma-400" />
              <span className="text-xs">
                <span className="text-white font-medium">{totalTransactions}</span>
                <span className="text-plasma-500 ml-1">TXs</span>
              </span>
            </div>
            {newTransactionsCount > 0 && (
              <div className="glass-60 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 border border-green-500/30">
                <Bell className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">
                  {newTransactionsCount} New
                </span>
              </div>
            )}
            
            {/* Mobile Refresh Button */}
            <Button
              onClick={() => fetchAllTransactions(10)}
              disabled={isFetchingTransactions}
              size="sm"
              className="sm:hidden glass-button ml-auto h-8 w-8 p-0"
            >
              <RefreshCw className={cn(
                "w-4 h-4",
                isFetchingTransactions && "animate-spin"
              )} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filters Bar - Glass */}
      <div className="glass-card p-3 lg:p-4">
        <div className="flex flex-col gap-3">
          {/* Search Row */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-plasma-500" />
            <Input
              placeholder="Search wallets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-10 w-full text-sm"
            />
          </div>
          
          {/* Filter Toggle - Mobile */}
          <div className="flex items-center justify-between sm:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-plasma-400"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <span className="text-xs text-plasma-600">{filter}</span>
          </div>
          
          {/* Filter Pills */}
          <div className={cn(
            "flex items-center gap-1 p-1 glass-40 rounded-lg transition-all",
            "sm:flex",
            showFilters ? "flex" : "hidden"
          )}>
            {(['all', 'active', 'paused'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 lg:px-4 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-300 capitalize flex-1 sm:flex-none",
                  filter === f 
                    ? "bg-plasma-500/20 text-white shadow-lg shadow-plasma-500/10" 
                    : "text-plasma-400 hover:text-plasma-200 hover:bg-white/5"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Wallets List */}
      {wallets.length === 0 ? (
        <Card className="glass-card border-dashed border-2 border-white/10">
          <CardContent className="py-12 lg:py-20 text-center px-4">
            <div className="relative inline-block mb-4 lg:mb-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl glass-60 flex items-center justify-center float-3d">
                <Wallet className="w-8 h-8 lg:w-10 lg:h-10 text-plasma-400" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-plasma-500/20 flex items-center justify-center">
                <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-plasma-300" />
              </div>
            </div>
            <h3 className="text-lg lg:text-xl font-medium mb-2 text-white">No wallets added yet</h3>
            <p className="text-plasma-500 text-sm mb-4 lg:mb-6 max-w-md mx-auto px-4">
              Add wallets to start tracking their transactions in real-time with full token metadata
            </p>
            <Button 
              onClick={() => {}}
              className="glass-button gap-2 text-sm"
            >
              <Wallet className="w-4 h-4" />
              Go to Wallet Management
            </Button>
          </CardContent>
        </Card>
      ) : filteredWallets.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 lg:py-16 text-center">
            <Search className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 text-plasma-500" />
            <h3 className="text-base lg:text-lg font-medium mb-1 text-white">No wallets match</h3>
            <p className="text-plasma-500 text-sm">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {filteredWallets.map((wallet, index) => {
            const data = walletData.get(wallet.address) || {
              ...wallet,
              transactions: [],
              lastUpdated: 0,
              isLoading: true,
            }
            
            return (
              <div 
                key={wallet.id}
                className="transform-gpu transition-all duration-500"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transform: `translateZ(${20 - index * 5}px)`
                }}
              >
                <WalletCard walletData={data} />
              </div>
            )
          })}
        </div>
      )}
      
      {/* Live Indicator - Desktop Only */}
      <div className={cn(
        "hidden lg:flex fixed bottom-6 right-6 glass-80 rounded-full px-4 py-2 items-center gap-2 glow-plasma-sm z-50",
        isConnected ? "border-green-500/30" : "border-yellow-500/30"
      )}>
        <span className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          isConnected ? "bg-green-500" : "bg-yellow-500"
        )} />
        <span className={cn(
          "text-xs",
          isConnected ? "text-green-400" : "text-yellow-400"
        )}>
          {isConnecting ? 'Connecting...' : isConnected ? 'Live Tracking' : 'Reconnecting...'}
        </span>
      </div>
    </div>
  )
}
