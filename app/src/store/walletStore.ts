// ═══════════════════════════════════════════════════════════════════════════════
// WALLET STORE - Zustand State Management
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Wallet, WalletWithTransactions, TokenMetadata } from '@/types/solana'
import { tokenMetadataService, transactionService } from '@/services/solana'

// ═══════════════════════════════════════════════════════════════════════════════
// STORE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface WalletStore {
  // State
  wallets: Wallet[]
  walletData: Map<string, WalletWithTransactions>
  selectedWallet: string | null
  expandedTransactions: Set<string>
  tokenMetadataCache: Map<string, TokenMetadata>
  
  // Loading states
  isLoading: boolean
  isFetchingTransactions: boolean
  error: string | null
  
  // Actions - Wallet Management
  addWallet: (address: string, name?: string) => Promise<boolean>
  deleteWallet: (walletId: string) => void
  updateWalletName: (walletId: string, name: string) => void
  toggleWalletActive: (walletId: string) => void
  
  // Actions - Transaction Tracking
  fetchTransactions: (walletAddress: string, limit?: number) => Promise<void>
  fetchAllTransactions: (limit?: number) => Promise<void>
  refreshWallet: (walletAddress: string) => Promise<void>
  
  // Actions - UI
  selectWallet: (walletId: string | null) => void
  toggleTransactionExpand: (signature: string) => void
  fetchTokenMetadata: (tokenMint: string) => Promise<TokenMetadata | null>
  
  // Actions - Data Management
  clearAllData: () => void
  clearError: () => void
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const isValidSolanaAddress = (address: string): boolean => {
  // Basic Solana address validation (base58, 32-44 characters)
  const base58Regex = /^[A-HJ-NP-Za-km-z1-9]{32,44}$/
  return base58Regex.test(address)
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      // ═══════════════════════════════════════════════════════════════════════
      // Initial State
      // ═══════════════════════════════════════════════════════════════════════
      wallets: [],
      walletData: new Map(),
      selectedWallet: null,
      expandedTransactions: new Set(),
      tokenMetadataCache: new Map(),
      isLoading: false,
      isFetchingTransactions: false,
      error: null,

      // ═══════════════════════════════════════════════════════════════════════
      // Wallet Management Actions
      // ═══════════════════════════════════════════════════════════════════════
      
      addWallet: async (address: string, name?: string) => {
        const { wallets } = get()
        
        // Validate address
        if (!isValidSolanaAddress(address)) {
          set({ error: 'Invalid Solana wallet address' })
          return false
        }
        
        // Check if wallet already exists
        if (wallets.some(w => w.address === address)) {
          set({ error: 'Wallet already exists' })
          return false
        }
        
        set({ isLoading: true, error: null })
        
        try {
          const newWallet: Wallet = {
            id: generateId(),
            address,
            name: name || `Wallet ${wallets.length + 1}`,
            isActive: true,
            addedAt: Date.now(),
          }
          
          set({ 
            wallets: [...wallets, newWallet],
            isLoading: false 
          })
          
          // Fetch initial transactions
          await get().fetchTransactions(address, 10)
          
          return true
        } catch (error) {
          set({ 
            error: 'Failed to add wallet',
            isLoading: false 
          })
          return false
        }
      },

      deleteWallet: (walletId: string) => {
        const { wallets, walletData } = get()
        
        const wallet = wallets.find(w => w.id === walletId)
        if (!wallet) return
        
        // Remove from wallets array
        const updatedWallets = wallets.filter(w => w.id !== walletId)
        
        // Remove from walletData map
        const updatedWalletData = new Map(walletData)
        updatedWalletData.delete(wallet.address)
        
        set({ 
          wallets: updatedWallets,
          walletData: updatedWalletData,
          selectedWallet: get().selectedWallet === walletId ? null : get().selectedWallet
        })
      },

      updateWalletName: (walletId: string, name: string) => {
        const { wallets } = get()
        
        const updatedWallets = wallets.map(w => 
          w.id === walletId ? { ...w, name } : w
        )
        
        set({ wallets: updatedWallets })
      },

      toggleWalletActive: (walletId: string) => {
        const { wallets } = get()
        
        const updatedWallets = wallets.map(w => 
          w.id === walletId ? { ...w, isActive: !w.isActive } : w
        )
        
        set({ wallets: updatedWallets })
      },

      // ═══════════════════════════════════════════════════════════════════════
      // Transaction Tracking Actions
      // ═══════════════════════════════════════════════════════════════════════
      
      fetchTransactions: async (walletAddress: string, limit = 10) => {
        const { walletData, wallets } = get()
        const wallet = wallets.find(w => w.address === walletAddress)
        
        if (!wallet) return
        
        set({ isFetchingTransactions: true })
        
        const existingData = walletData.get(walletAddress)
        
        try {
          const transactions = await transactionService.fetchRecentTransactions(
            walletAddress, 
            limit
          )
          
          const updatedWalletData: WalletWithTransactions = {
            ...wallet,
            transactions: transactions.map(tx => ({
              ...tx,
              isNew: existingData ? !existingData.transactions.some(t => t.signature === tx.signature) : false
            })),
            lastUpdated: Date.now(),
            isLoading: false,
          }
          
          const newWalletData = new Map(walletData)
          newWalletData.set(walletAddress, updatedWalletData)
          
          set({ walletData: newWalletData })
        } catch (error) {
          console.error('Error fetching transactions:', error)
          
          const updatedWalletData: WalletWithTransactions = {
            ...wallet,
            transactions: existingData?.transactions || [],
            lastUpdated: Date.now(),
            isLoading: false,
            error: 'Failed to fetch transactions',
          }
          
          const newWalletData = new Map(walletData)
          newWalletData.set(walletAddress, updatedWalletData)
          
          set({ walletData: newWalletData })
        } finally {
          set({ isFetchingTransactions: false })
        }
      },

      fetchAllTransactions: async (limit = 10) => {
        const { wallets } = get()
        
        for (const wallet of wallets) {
          if (wallet.isActive) {
            await get().fetchTransactions(wallet.address, limit)
          }
        }
      },

      refreshWallet: async (walletAddress: string) => {
        await get().fetchTransactions(walletAddress, 10)
      },

      // ═══════════════════════════════════════════════════════════════════════
      // UI Actions
      // ═══════════════════════════════════════════════════════════════════════
      
      selectWallet: (walletId: string | null) => {
        set({ selectedWallet: walletId })
      },

      toggleTransactionExpand: (signature: string) => {
        const { expandedTransactions } = get()
        const newExpanded = new Set(expandedTransactions)
        
        if (newExpanded.has(signature)) {
          newExpanded.delete(signature)
        } else {
          newExpanded.add(signature)
        }
        
        set({ expandedTransactions: newExpanded })
      },

      fetchTokenMetadata: async (tokenMint: string) => {
        const { tokenMetadataCache } = get()
        
        // Check cache first
        if (tokenMetadataCache.has(tokenMint)) {
          return tokenMetadataCache.get(tokenMint)!
        }
        
        try {
          const metadata = await tokenMetadataService.getTokenMetadata(tokenMint)
          
          const newCache = new Map(tokenMetadataCache)
          newCache.set(tokenMint, metadata)
          
          set({ tokenMetadataCache: newCache })
          
          return metadata
        } catch (error) {
          console.error('Error fetching token metadata:', error)
          return null
        }
      },

      // ═══════════════════════════════════════════════════════════════════════
      // Data Management Actions
      // ═══════════════════════════════════════════════════════════════════════
      
      clearAllData: () => {
        set({
          wallets: [],
          walletData: new Map(),
          selectedWallet: null,
          expandedTransactions: new Set(),
          tokenMetadataCache: new Map(),
          error: null,
        })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'solana-tracker-storage',
      partialize: (state) => ({
        wallets: state.wallets,
        tokenMetadataCache: Array.from(state.tokenMetadataCache.entries()),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert array back to Map after rehydration
          state.tokenMetadataCache = new Map(state.tokenMetadataCache as any)
          state.walletData = new Map()
        }
      },
    }
  )
)

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTOR HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export const useWallets = () => useWalletStore(state => state.wallets)
export const useWalletData = (address: string) => 
  useWalletStore(state => state.walletData.get(address))
export const useSelectedWallet = () => useWalletStore(state => state.selectedWallet)
export const useIsTransactionExpanded = (signature: string) => 
  useWalletStore(state => state.expandedTransactions.has(signature))
export const useTokenMetadata = (mint: string) => 
  useWalletStore(state => state.tokenMetadataCache.get(mint))
