import { WalletWithUsers } from '../types/swap-types'

export class WalletPool {
  static subscriptions = new Map<string, number>()
  static wallets: WalletWithUsers[] = []
  static bannedWallets = new Map<string, boolean>()

  // Promise-based mutex to prevent race conditions
  // Uses a queue-based approach that is truly atomic
  private static _lockPromise: Promise<void> = Promise.resolve()
  private static _lockCount = 0

  /**
   * Execute an operation with exclusive lock access
   * Uses Promise chaining to ensure true atomicity without TOCTOU race conditions
   */
  static async withLock<T>(operation: () => Promise<T>): Promise<T> {
    // Queue-based mutex: each caller waits for the previous operation to complete
    // This is atomic because Promise.then() is guaranteed to execute in order
    let releaseLock: () => void
    
    const previousLock = WalletPool._lockPromise
    WalletPool._lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve
    })
    
    WalletPool._lockCount++
    const lockId = WalletPool._lockCount
    
    try {
      // Wait for any previous operation to complete
      await previousLock
      
      // Execute the operation with exclusive access
      return await operation()
    } catch (error) {
      // Re-throw to allow caller to handle
      throw error
    } finally {
      // Release the lock for the next operation in queue
      releaseLock!()
    }
  }

  /**
   * Find wallet index by address
   * Note: Call within withLock() for thread-safe operations
   */
  static findWalletIndex(address: string): number {
    return WalletPool.wallets.findIndex((w) => w.address === address)
  }

  /**
   * Update wallet at index
   * Note: Call within withLock() for thread-safe operations
   */
  static updateWallet(index: number, wallet: WalletWithUsers): void {
    if (index >= 0 && index < WalletPool.wallets.length) {
      WalletPool.wallets[index] = wallet
    }
  }

  /**
   * Remove wallet at index
   * Note: Call within withLock() for thread-safe operations
   */
  static removeWallet(index: number): void {
    if (index >= 0 && index < WalletPool.wallets.length) {
      WalletPool.wallets.splice(index, 1)
    }
  }
}
