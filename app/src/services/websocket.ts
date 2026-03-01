// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVICE - Real-time Connection to Backend
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastMessage: WebSocketMessage | null
  subscribedWallets: Set<string>
}

export interface WebSocketActions {
  connect: () => void
  disconnect: () => void
  subscribeWallet: (walletAddress: string) => void
  unsubscribeWallet: (walletAddress: string) => void
  subscribeTransactions: (walletAddress: string) => void
  unsubscribeTransactions: (walletAddress: string) => void
  send: (message: any) => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws'
const RECONNECT_DELAY = 5000
const PING_INTERVAL = 30000

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET STORE
// ═══════════════════════════════════════════════════════════════════════════════

interface WebSocketStore extends WebSocketState, WebSocketActions {
  socket: WebSocket | null
  pingInterval: NodeJS.Timeout | null
  reconnectTimeout: NodeJS.Timeout | null
  setSocket: (socket: WebSocket | null) => void
  setConnected: (connected: boolean) => void
  setConnecting: (connecting: boolean) => void
  setError: (error: string | null) => void
  setLastMessage: (message: WebSocketMessage | null) => void
  addSubscribedWallet: (wallet: string) => void
  removeSubscribedWallet: (wallet: string) => void
  startPing: () => void
  stopPing: () => void
  reconnect: () => void
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  pingInterval: null,
  reconnectTimeout: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  lastMessage: null,
  subscribedWallets: new Set(),

  setSocket: (socket) => set({ socket }),
  setConnected: (isConnected) => set({ isConnected }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error }),
  setLastMessage: (lastMessage) => set({ lastMessage }),
  
  addSubscribedWallet: (wallet) => set((state) => ({
    subscribedWallets: new Set([...state.subscribedWallets, wallet]),
  })),
  
  removeSubscribedWallet: (wallet) => set((state) => {
    const newSet = new Set(state.subscribedWallets)
    newSet.delete(wallet)
    return { subscribedWallets: newSet }
  }),

  startPing: () => {
    const { pingInterval } = get()
    if (pingInterval) clearInterval(pingInterval)
    
    const interval = setInterval(() => {
      const { socket, isConnected } = get()
      if (socket && isConnected) {
        socket.send(JSON.stringify({ action: 'ping' }))
      }
    }, PING_INTERVAL)
    
    set({ pingInterval: interval })
  },

  stopPing: () => {
    const { pingInterval } = get()
    if (pingInterval) {
      clearInterval(pingInterval)
      set({ pingInterval: null })
    }
  },

  reconnect: () => {
    const { reconnectTimeout } = get()
    if (reconnectTimeout) clearTimeout(reconnectTimeout)
    
    const timeout = setTimeout(() => {
      console.log('Attempting to reconnect...')
      get().connect()
    }, RECONNECT_DELAY)
    
    set({ reconnectTimeout: timeout })
  },

  connect: () => {
    const { socket, isConnecting, isConnected, reconnectTimeout } = get()
    
    // Clear any pending reconnect
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      set({ reconnectTimeout: null })
    }
    
    // Don't connect if already connected or connecting
    if (socket?.readyState === WebSocket.OPEN || isConnecting) {
      return
    }

    set({ isConnecting: true, error: null })

    try {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('WebSocket connected')
        set({ 
          isConnected: true, 
          isConnecting: false, 
          error: null,
          socket: ws 
        })
        
        // Start ping interval
        get().startPing()
        
        // Re-subscribe to previously subscribed wallets
        const { subscribedWallets } = get()
        subscribedWallets.forEach(wallet => {
          ws.send(JSON.stringify({ action: 'subscribe-wallet', wallet }))
          ws.send(JSON.stringify({ action: 'subscribe-transactions', wallet }))
        })
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          // Handle pong
          if (message.type === 'pong') return
          
          set({ lastMessage: message })
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        set({ 
          error: 'WebSocket connection error', 
          isConnecting: false,
          isConnected: false 
        })
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        set({ 
          isConnected: false, 
          isConnecting: false,
          socket: null 
        })
        
        // Stop ping interval
        get().stopPing()
        
        // Auto-reconnect
        get().reconnect()
      }

      set({ socket: ws })
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      set({ 
        error: 'Failed to create WebSocket connection', 
        isConnecting: false 
      })
      
      // Try to reconnect
      get().reconnect()
    }
  },

  disconnect: () => {
    const { socket, pingInterval, reconnectTimeout } = get()
    
    // Clear intervals
    if (pingInterval) clearInterval(pingInterval)
    if (reconnectTimeout) clearTimeout(reconnectTimeout)
    
    if (socket) {
      socket.close()
    }
    
    set({ 
      socket: null, 
      isConnected: false, 
      isConnecting: false,
      pingInterval: null,
      reconnectTimeout: null,
      subscribedWallets: new Set()
    })
  },

  subscribeWallet: (walletAddress: string) => {
    const { socket, isConnected, addSubscribedWallet } = get()
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        action: 'subscribe-wallet',
        wallet: walletAddress,
      }))
      addSubscribedWallet(walletAddress)
    }
  },

  unsubscribeWallet: (walletAddress: string) => {
    const { socket, isConnected, removeSubscribedWallet } = get()
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        action: 'unsubscribe-wallet',
        wallet: walletAddress,
      }))
      removeSubscribedWallet(walletAddress)
    }
  },

  subscribeTransactions: (walletAddress: string) => {
    const { socket, isConnected } = get()
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        action: 'subscribe-transactions',
        wallet: walletAddress,
      }))
    }
  },

  unsubscribeTransactions: (walletAddress: string) => {
    const { socket, isConnected } = get()
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        action: 'unsubscribe-transactions',
        wallet: walletAddress,
      }))
    }
  },

  send: (message: any) => {
    const { socket, isConnected } = get()
    if (socket && isConnected) {
      socket.send(JSON.stringify(message))
    }
  },
}))

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET HOOK
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useCallback } from 'react'

export function useWebSocket() {
  const store = useWebSocketStore()

  useEffect(() => {
    // Auto-connect on mount
    if (!store.isConnected && !store.isConnecting) {
      store.connect()
    }

    return () => {
      // Don't disconnect on unmount to maintain connection across components
    }
  }, [])

  const subscribeWallet = useCallback((walletAddress: string) => {
    store.subscribeWallet(walletAddress)
  }, [store])

  const unsubscribeWallet = useCallback((walletAddress: string) => {
    store.unsubscribeWallet(walletAddress)
  }, [store])

  const subscribeTransactions = useCallback((walletAddress: string) => {
    store.subscribeTransactions(walletAddress)
  }, [store])

  const unsubscribeTransactions = useCallback((walletAddress: string) => {
    store.unsubscribeTransactions(walletAddress)
  }, [store])

  return {
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    error: store.error,
    lastMessage: store.lastMessage,
    subscribedWallets: store.subscribedWallets,
    subscribeWallet,
    unsubscribeWallet,
    subscribeTransactions,
    unsubscribeTransactions,
    connect: store.connect,
    disconnect: store.disconnect,
  }
}
