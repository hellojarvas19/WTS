// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION CARD - Mobile-Optimized 3D Glassmorphism with Expandable Details
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft,
  Flame,
  Shield,
  DollarSign,
  Clock,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Transaction, TokenMetadata } from '@/types/solana'
import { RISK_COLORS, RISK_BG_COLORS } from '@/types/solana'
import { useWalletStore } from '@/store/walletStore'

interface TransactionCardProps {
  transaction: Transaction
  walletName: string
}

const PLATFORM_COLORS: Record<string, string> = {
  raydium: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  jupiter: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  pumpfun: 'bg-green-500/10 text-green-400 border-green-500/30',
  pumpfun_amm: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  mint_pumpfun: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  transfer: 'bg-plasma-500/10 text-plasma-400 border-plasma-500/30',
  unknown: 'bg-white/5 text-plasma-500',
}

const TYPE_ICONS = {
  buy: TrendingUp,
  sell: TrendingDown,
  transfer: ArrowRightLeft,
  mint: Flame,
  unknown: ArrowRightLeft,
}

const TYPE_COLORS = {
  buy: 'text-green-400',
  sell: 'text-red-400',
  transfer: 'text-blue-400',
  mint: 'text-orange-400',
  unknown: 'text-plasma-400',
}

const TYPE_BG_COLORS = {
  buy: 'bg-green-500/10 border-green-500/30',
  sell: 'bg-red-500/10 border-red-500/30',
  transfer: 'bg-blue-500/10 border-blue-500/30',
  mint: 'bg-orange-500/10 border-orange-500/30',
  unknown: 'bg-plasma-500/10 border-plasma-500/30',
}

function formatNumber(num: number | undefined): string {
  if (num === undefined || isNaN(num)) return 'N/A'
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  
  return date.toLocaleDateString()
}

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function TransactionCard({ transaction, walletName }: TransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const fetchTokenMetadata = useWalletStore(state => state.fetchTokenMetadata)
  
  const TypeIcon = TYPE_ICONS[transaction.type] || ArrowRightLeft
  
  const tokenMint = transaction.tokenIn?.mint || transaction.tokenOut?.mint
  
  useEffect(() => {
    if (isExpanded && tokenMint && !tokenMetadata) {
      setIsLoadingMetadata(true)
      fetchTokenMetadata(tokenMint).then(metadata => {
        setTokenMetadata(metadata)
        setIsLoadingMetadata(false)
      })
    }
  }, [isExpanded, tokenMint, fetchTokenMetadata])
  
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleOpenExplorer = () => {
    window.open(`https://solscan.io/tx/${transaction.signature}`, '_blank')
  }

  return (
    <Card className={cn(
      "glass-card overflow-hidden transition-all duration-500",
      transaction.isNew && "border-plasma-400/50 shadow-lg shadow-plasma-500/20",
      isExpanded && "shadow-2xl shadow-black/50"
    )}>
      {/* Main Transaction Row */}
      <CardContent className="p-0">
        <div 
          className="p-3 lg:p-4 cursor-pointer hover:bg-white/[0.02] transition-colors active:bg-white/[0.04]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Type Icon */}
            <div className={cn(
              "w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
              TYPE_BG_COLORS[transaction.type]
            )}>
              <TypeIcon className={cn("w-5 h-5 lg:w-6 lg:h-6", TYPE_COLORS[transaction.type])} />
            </div>
            
            {/* Transaction Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                <span className="font-medium capitalize text-white text-sm lg:text-base">{transaction.type}</span>
                <Badge 
                  variant="outline" 
                  className={cn("text-[10px] lg:text-xs px-1.5 py-0", PLATFORM_COLORS[transaction.platform])}
                >
                  {transaction.platform}
                </Badge>
                {transaction.isNew && (
                  <span className="text-[10px] lg:text-xs text-plasma-300 bg-plasma-500/20 px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs lg:text-sm text-plasma-500 mt-0.5">
                <span className="truncate">{walletName}</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{formatTime(transaction.timestamp)}</span>
              </div>
            </div>
            
            {/* Amount Info */}
            <div className="text-right shrink-0">
              {transaction.solAmount && (
                <div className={cn(
                  "font-medium text-sm lg:text-base",
                  transaction.type === 'buy' ? 'text-green-400' : 
                  transaction.type === 'sell' ? 'text-red-400' : 'text-plasma-300'
                )}>
                  {transaction.type === 'buy' ? '-' : '+'}
                  {transaction.solAmount.toFixed(3)} SOL
                </div>
              )}
              {transaction.tokenIn && transaction.type !== 'buy' && (
                <div className="text-xs text-plasma-500">
                  {parseFloat(transaction.tokenIn.amount).toFixed(2)} {transaction.tokenIn.symbol}
                </div>
              )}
              {transaction.tokenOut && transaction.type === 'buy' && (
                <div className="text-xs text-plasma-500">
                  {parseFloat(transaction.tokenOut.amount).toFixed(2)} {transaction.tokenOut.symbol}
                </div>
              )}
            </div>
            
            {/* Expand Icon */}
            <div className={cn(
              "shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center transition-all duration-300",
              isExpanded ? "bg-plasma-500/20" : "bg-white/5"
            )}>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-plasma-400" />
              ) : (
                <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-plasma-500" />
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-white/5 bg-black/30 p-3 lg:p-5 space-y-4 lg:space-y-5">
            {/* Transaction Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5">
              <div className="space-y-2 lg:space-y-3">
                <h4 className="text-[10px] lg:text-xs font-medium text-plasma-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-0.5 h-3 lg:h-4 bg-plasma-500 rounded-full" />
                  Transaction
                </h4>
                
                {/* Signature */}
                <div className="glass-60 rounded-lg p-2.5 lg:p-3 flex items-center justify-between gap-2">
                  <span className="text-xs lg:text-sm text-plasma-500 shrink-0">Signature</span>
                  <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
                    <code className="text-[10px] lg:text-xs text-plasma-300 bg-black/50 px-1.5 lg:px-2 py-0.5 rounded truncate">
                      {shortenAddress(transaction.signature)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 lg:h-7 lg:w-7 glass-button shrink-0"
                      onClick={() => handleCopy(transaction.signature)}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-plasma-500" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Status */}
                <div className="glass-60 rounded-lg p-2.5 lg:p-3 flex items-center justify-between">
                  <span className="text-xs lg:text-sm text-plasma-500">Status</span>
                  <Badge 
                    variant={transaction.status === 'confirmed' ? 'default' : 'destructive'}
                    className={cn(
                      "text-[10px] lg:text-xs",
                      transaction.status === 'confirmed' 
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    )}
                  >
                    {transaction.status}
                  </Badge>
                </div>
                
                {/* Platform */}
                <div className="glass-60 rounded-lg p-2.5 lg:p-3 flex items-center justify-between">
                  <span className="text-xs lg:text-sm text-plasma-500">Platform</span>
                  <span className="text-xs lg:text-sm font-medium text-white capitalize">{transaction.platform}</span>
                </div>
              </div>
              
              {/* Token Metadata */}
              <div className="space-y-2 lg:space-y-3">
                <h4 className="text-[10px] lg:text-xs font-medium text-plasma-500 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-0.5 h-3 lg:h-4 bg-plasma-500 rounded-full" />
                  Token Info
                </h4>
                
                {isLoadingMetadata ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 lg:h-14 w-full bg-white/5" />
                    <Skeleton className="h-12 lg:h-14 w-full bg-white/5" />
                  </div>
                ) : tokenMetadata ? (
                  <div className="space-y-2 lg:space-y-3">
                    {/* Token Header */}
                    <div className="glass-60 rounded-lg p-2.5 lg:p-3 flex items-center gap-2.5 lg:gap-3">
                      {tokenMetadata.image ? (
                        <img 
                          src={tokenMetadata.image} 
                          alt={tokenMetadata.symbol}
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-plasma-600 to-plasma-800 flex items-center justify-center border border-white/10">
                          <span className="text-white font-bold text-base lg:text-lg">
                            {tokenMetadata.symbol?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-white text-sm lg:text-base truncate">{tokenMetadata.name}</div>
                        <div className="text-xs text-plasma-500">{tokenMetadata.symbol}</div>
                      </div>
                    </div>
                    
                    {/* Market Data Grid */}
                    <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                      <div className="glass-60 rounded-lg p-2 lg:p-3">
                        <div className="flex items-center gap-1 text-plasma-500 text-[10px] lg:text-xs mb-0.5">
                          <DollarSign className="w-3 h-3" />
                          Price
                        </div>
                        <div className="font-medium text-white text-xs lg:text-sm">
                          {tokenMetadata.priceUsd ? `$${tokenMetadata.priceUsd.toFixed(6)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="glass-60 rounded-lg p-2 lg:p-3">
                        <div className="flex items-center gap-1 text-plasma-500 text-[10px] lg:text-xs mb-0.5">
                          <TrendingUp className="w-3 h-3" />
                          MC
                        </div>
                        <div className="font-medium text-white text-xs lg:text-sm">{formatNumber(tokenMetadata.marketCap)}</div>
                      </div>
                    </div>
                    
                    {/* Risk Level */}
                    {tokenMetadata.riskLevel && (
                      <div className={cn(
                        "flex items-center justify-between p-2 lg:p-3 rounded-lg border",
                        RISK_BG_COLORS[tokenMetadata.riskLevel]
                      )}>
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          <Shield className={cn("w-3.5 h-3.5 lg:w-4 lg:h-4", RISK_COLORS[tokenMetadata.riskLevel])} />
                          <span className="text-xs lg:text-sm font-medium text-white">Risk</span>
                        </div>
                        <span className={cn("font-bold uppercase text-[10px] lg:text-xs", RISK_COLORS[tokenMetadata.riskLevel])}>
                          {tokenMetadata.riskLevel}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-60 rounded-lg p-4 lg:p-6 text-center text-plasma-500">
                    <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-1.5 lg:mb-2 opacity-50" />
                    <span className="text-xs lg:text-sm">No metadata</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 lg:pt-3 border-t border-white/5">
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
