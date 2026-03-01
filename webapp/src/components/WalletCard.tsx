// ═══════════════════════════════════════════════════════════════════════════════
// WALLET CARD - Mobile-Optimized 3D Glassmorphism with Transaction List
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import { 
  Wallet, 
  RefreshCw, 
  ExternalLink, 
  Activity,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Radio
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TransactionCard } from './TransactionCard'
import type { WalletWithTransactions } from '@/types/solana'
import { useWalletStore } from '@/store/walletStore'

interface WalletCardProps {
  walletData: WalletWithTransactions
}

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString()
}

export function WalletCard({ walletData }: WalletCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  
  const refreshWallet = useWalletStore(state => state.refreshWallet)
  const isFetchingTransactions = useWalletStore(state => state.isFetchingTransactions)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletData.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleRefresh = () => {
    refreshWallet(walletData.address)
  }
  
  const handleOpenExplorer = () => {
    window.open(`https://solscan.io/account/${walletData.address}`, '_blank')
  }
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (walletData.isActive) {
        refreshWallet(walletData.address)
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [walletData.address, walletData.isActive, refreshWallet])

  return (
    <Card className="glass-card overflow-hidden group">
      {/* Header */}
      <CardHeader className="p-3 lg:p-4 pb-2 lg:pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 lg:gap-4 min-w-0">
            {/* Wallet Icon */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-plasma-500 to-plasma-700 flex items-center justify-center glow-plasma-sm group-hover:glow-plasma transition-all duration-300">
                <Wallet className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              {walletData.isActive && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
              )}
            </div>
            
            <div className="min-w-0">
              <CardTitle className="text-sm lg:text-lg text-white group-hover:glow-text transition-all truncate">
                {walletData.name}
              </CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5 lg:mt-1">
                <code className="text-[10px] lg:text-xs text-plasma-500 bg-black/50 px-1.5 py-0.5 rounded">
                  {shortenAddress(walletData.address)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 lg:h-6 lg:w-6 glass-button"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-green-400" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-plasma-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 lg:gap-2 shrink-0">
            {/* Status Badge */}
            <Badge 
              variant={walletData.isActive ? 'default' : 'secondary'}
              className={cn(
                "text-[10px] lg:text-xs px-1.5 py-0.5",
                walletData.isActive 
                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                  : "bg-plasma-700/30 text-plasma-400 border-plasma-600/30"
              )}
            >
              {walletData.isActive ? 'Active' : 'Paused'}
            </Badge>
            
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 lg:h-9 lg:w-9 glass-button"
              onClick={handleRefresh}
              disabled={isFetchingTransactions}
            >
              <RefreshCw className={cn(
                "w-3.5 h-3.5 lg:w-4 lg:h-4 text-plasma-400",
                isFetchingTransactions && "animate-spin"
              )} />
            </Button>
            
            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 lg:h-9 lg:w-9 glass-button"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-plasma-400" />
              ) : (
                <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-plasma-400" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-3 lg:gap-4 mt-2 lg:mt-3 text-xs lg:text-sm">
          <div className="flex items-center gap-1 text-plasma-500">
            <Activity className="w-3 h-3 lg:w-4 lg:h-4" />
            <span>{walletData.transactions.length} TXs</span>
          </div>
          {walletData.lastUpdated > 0 && (
            <div className="text-plasma-600 text-[10px] lg:text-sm">
              {formatTimeAgo(walletData.lastUpdated)}
            </div>
          )}
          {walletData.error && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] lg:text-xs">
              Error
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {/* Transactions */}
      {isExpanded && (
        <CardContent className="pt-0 px-3 lg:px-4 pb-3 lg:pb-4">
          {walletData.isLoading ? (
            <div className="space-y-2 lg:space-y-3">
              <Skeleton className="h-16 lg:h-20 w-full bg-white/5" />
              <Skeleton className="h-16 lg:h-20 w-full bg-white/5" />
            </div>
          ) : walletData.transactions.length > 0 ? (
            <div className="space-y-2 lg:space-y-3">
              {walletData.transactions.slice(0, 5).map((transaction, index) => (
                <div 
                  key={transaction.signature}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TransactionCard 
                    transaction={transaction}
                    walletName={walletData.name}
                  />
                </div>
              ))}
              {walletData.transactions.length > 5 && (
                <div className="text-center py-2 lg:py-3">
                  <span className="text-xs lg:text-sm text-plasma-500">
                    +{walletData.transactions.length - 5} more transactions
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 lg:py-12 glass-60 rounded-xl">
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl glass-40 flex items-center justify-center mx-auto mb-3 lg:mb-4 float-3d">
                <Radio className="w-6 h-6 lg:w-8 lg:h-8 text-plasma-500" />
              </div>
              <p className="text-plasma-400 font-medium text-sm lg:text-base">No transactions</p>
              <p className="text-xs lg:text-sm text-plasma-600 mt-0.5 lg:mt-1">
                Transactions appear here
              </p>
            </div>
          )}
          
          {/* View on Explorer */}
          <div className="mt-3 lg:mt-5 pt-3 lg:pt-4 border-t border-white/5 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExplorer}
              className="glass-button gap-1.5 lg:gap-2 text-xs lg:text-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              View on Solscan
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
