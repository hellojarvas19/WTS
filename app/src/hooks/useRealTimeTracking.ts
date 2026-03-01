// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME TRACKING HOOK - WebSocket Integration for Live Updates
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback, useState } from 'react'
import { useWebSocket, WebSocketMessage } from '@/services/websocket'
import { useWalletStore } from '@/store/walletStore'
import { Transaction } from '@/types/solana'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface RealTimeTransaction {
  signature: string
  timestamp: number
  type: 'buy' | 'sell' | 'transfer' | 'unknown'
  platform: 'raydium' | 'jupiter' | 'pumpfun' | 'unknown'
  owner: string
  description: string
  tokenIn?: {
    mint: string
    symbol: string
    amount: string
    decimals: number
  }
  tokenOut?: {
    mint: string
    symbol: string
    amount: string
    decimals: number
  }
  solAmount: number
  lamportsAmount: number
  status: 'confirmed' | 'failed'
  isNew: boolean
}

interface WalletUpdate {
  wallet: string
  balance?: {
    lamports: number
    sol: number
    usd: number
  }
  transactions?: RealTimeTransaction[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME TRACKING HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useRealTimeTracking() {
  const ws = useWebSocket()
  const walletData = useWalletStore(state => state.walletData)
  const wallets = useWalletStore(state => state.wallets)
  const fetchTransactions = useWalletStore(state => state.fetchTransactions)
  
  const processedMessages = useRef<Set<string>>(new Set())
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

  // Subscribe to all active wallets
  useEffect(() => {
    if (!ws.isConnected) return

    const activeWallets = wallets.filter(w => w.isActive)
    
    // Subscribe to each active wallet
    activeWallets.forEach(wallet => {
      ws.subscribeWallet(wallet.address)
      ws.subscribeTransactions(wallet.address)
    })

    return () => {
      // Unsubscribe when wallets change
      activeWallets.forEach(wallet => {
        ws.unsubscribeWallet(wallet.address)
        ws.unsubscribeTransactions(wallet.address)
      })
    }
  }, [ws.isConnected, wallets])

  // Process incoming WebSocket messages
  useEffect(() => {
    if (!ws.lastMessage) return

    const { lastMessage } = ws
    const messageId = `${lastMessage.type}-${lastMessage.timestamp}`
    
    // Prevent duplicate processing
    if (processedMessages.current.has(messageId)) return
    processedMessages.current.add(messageId)
    
    // Clean up old message IDs (keep last 100)
    if (processedMessages.current.size > 100) {
      const iterator = processedMessages.current.values()
      const first = iterator.next()
      if (!first.done) {
        processedMessages.current.delete(first.value)
      }
    }

    switch (lastMessage.type) {
      case 'new-transaction':
        handleNewTransaction(lastMessage.data)
        break
      case 'wallet-update':
        handleWalletUpdate(lastMessage.data)
        break
      case 'balance-update':
        handleBalanceUpdate(lastMessage.data)
        break
    }
  }, [ws.lastMessage])

  const handleNewTransaction = useCallback((data: { wallet: string; transaction: RealTimeTransaction }) => {
    const { wallet, transaction } = data
    
    // Refresh transactions for this wallet
    fetchTransactions(wallet, 10)
    
    // Show notification if enabled
    if (Notification.permission === 'granted') {
      new Notification('New Transaction', {
        body: `${transaction.description}`,
        icon: '/solana-icon.png',
      })
    }
  }, [fetchTransactions])

  const handleWalletUpdate = useCallback((data: WalletUpdate) => {
    // Handle wallet update - refresh data
    if (data.wallet) {
      fetchTransactions(data.wallet, 10)
    }
  }, [fetchTransactions])

  const handleBalanceUpdate = useCallback((data: { wallet: string; balance: { lamports: number; sol: number } }) => {
    // Balance updates are handled by the wallet store
    console.log('Balance update:', data)
  }, [])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return {
    isConnected: ws.isConnected,
    isConnecting: ws.isConnecting,
    error: ws.error,
    subscribedWallets: ws.subscribedWallets,
    connect: ws.connect,
    disconnect: ws.disconnect,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-TIME TRANSACTIONS HOOK - For specific wallet
// ═══════════════════════════════════════════════════════════════════════════════

export function useRealTimeTransactions(walletAddress: string) {
  const ws = useWebSocket()
  const transactions = useRef<RealTimeTransaction[]>([])
  const [latestTransaction, setLatestTransaction] = useState<RealTimeTransaction | null>(null)
  const walletData = useWalletStore(state => state.walletData.get(walletAddress))

  useEffect(() => {
    if (!ws.isConnected || !walletAddress) return

    ws.subscribeTransactions(walletAddress)

    return () => {
      ws.unsubscribeTransactions(walletAddress)
    }
  }, [ws.isConnected, walletAddress])

  useEffect(() => {
    if (!ws.lastMessage) return

    if (ws.lastMessage.type === 'new-transaction' && ws.lastMessage.data?.wallet === walletAddress) {
      const tx = ws.lastMessage.data.transaction
      transactions.current.unshift(tx)
      setLatestTransaction(tx)
      
      // Keep only last 100 transactions
      if (transactions.current.length > 100) {
        transactions.current = transactions.current.slice(0, 100)
      }
    }
  }, [ws.lastMessage, walletAddress])

  return {
    transactions: transactions.current,
    latestTransaction,
    isConnected: ws.isConnected,
    walletData,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE INDICATOR HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useLiveIndicator() {
  const { isConnected } = useWebSocket()
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (isConnected) {
      setPulse(true)
      const timeout = setTimeout(() => setPulse(false), 1000)
      return () => clearTimeout(timeout)
    }
  }, [isConnected])

  return {
    isLive: isConnected,
    pulse,
  }
}
