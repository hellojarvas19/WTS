import { Connection, clusterApiUrl } from '@solana/web3.js'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

// ═══════════════════════════════════════════════════════════════════════════════
// HELIUS API KEY MANAGEMENT
// Supports multiple API keys for load balancing and higher throughput
// Format: HELIUS_API_KEY, HELIUS_API_KEY1, HELIUS_API_KEY2, etc.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Load all Helius API keys from environment variables
 * Supports: HELIUS_API_KEY, HELIUS_API_KEY1, HELIUS_API_KEY2, ... HELIUS_API_KEY99
 */
function loadHeliusApiKeys(): string[] {
  const keys: string[] = []
  
  // Load main key
  if (process.env.HELIUS_API_KEY) {
    keys.push(process.env.HELIUS_API_KEY)
  }
  
  // Load numbered keys (HELIUS_API_KEY1 through HELIUS_API_KEY99)
  for (let i = 1; i <= 99; i++) {
    const key = process.env[`HELIUS_API_KEY${i}`]
    if (key && key.trim()) {
      keys.push(key.trim())
    }
  }
  
  return keys
}

const HELIUS_API_KEYS = loadHeliusApiKeys()

console.log(chalk.bold.cyan(`LOADED ${HELIUS_API_KEYS.length} HELIUS API KEY${HELIUS_API_KEYS.length !== 1 ? 'S' : ''}`))

// ═══════════════════════════════════════════════════════════════════════════════
// HELIUS CONNECTION MANAGER
// Manages multiple Helius connections for fast wallet tracking
// ═══════════════════════════════════════════════════════════════════════════════

export class HeliusConnectionManager {
  private static connections: Connection[] = []
  private static apiKeys: string[] = HELIUS_API_KEYS
  private static currentIndex: number = 0
  private static logConnectionIndex: number = 0

  static {
    // Initialize connections for each API key
    HeliusConnectionManager.connections = HELIUS_API_KEYS.map(
      (key) => new Connection(`https://mainnet.helius-rpc.com/?api-key=${key}`, 'confirmed')
    )
    
    // Fallback to default if no keys
    if (HeliusConnectionManager.connections.length === 0 && process.env.HELIUS_API_KEY) {
      HeliusConnectionManager.connections.push(
        new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`, 'confirmed')
      )
    }
  }

  /**
   * Get a random Helius connection for load balancing
   */
  static getRandomConnection(): Connection | null {
    if (HeliusConnectionManager.connections.length === 0) {
      return null
    }
    const randomIndex = Math.floor(Math.random() * HeliusConnectionManager.connections.length)
    const connection = HeliusConnectionManager.connections[randomIndex]
    return connection ?? null
  }

  /**
   * Get the next Helius connection using round-robin
   * Better distribution than random for high-volume scenarios
   */
  static getNextConnection(): Connection | null {
    if (HeliusConnectionManager.connections.length === 0) {
      return null
    }
    // Ensure index is within bounds (defensive)
    const safeIndex = HeliusConnectionManager.currentIndex % HeliusConnectionManager.connections.length
    const connection = HeliusConnectionManager.connections[safeIndex]
    
    HeliusConnectionManager.currentIndex = 
      (HeliusConnectionManager.currentIndex + 1) % HeliusConnectionManager.connections.length
    
    return connection ?? null
  }

  /**
   * Get a random API key for HTTP API calls
   */
  static getRandomApiKey(): string | null {
    if (HeliusConnectionManager.apiKeys.length === 0) {
      return null
    }
    const randomIndex = Math.floor(Math.random() * HeliusConnectionManager.apiKeys.length)
    const key = HeliusConnectionManager.apiKeys[randomIndex]
    return key ?? null
  }

  /**
   * Get the next API key using round-robin
   */
  static getNextApiKey(): string | null {
    if (HeliusConnectionManager.apiKeys.length === 0) {
      return null
    }
    // Ensure index is within bounds (defensive)
    const safeIndex = HeliusConnectionManager.currentIndex % HeliusConnectionManager.apiKeys.length
    const key = HeliusConnectionManager.apiKeys[safeIndex]
    
    HeliusConnectionManager.currentIndex = 
      (HeliusConnectionManager.currentIndex + 1) % HeliusConnectionManager.apiKeys.length
    
    return key ?? null
  }

  /**
   * Get all API keys (for parallel requests)
   */
  static getAllApiKeys(): string[] {
    return [...HeliusConnectionManager.apiKeys]
  }

  /**
   * Get count of available API keys
   */
  static getKeyCount(): number {
    return HeliusConnectionManager.apiKeys.length
  }

  /**
   * Get a specific connection for log subscriptions (round-robin)
   * This ensures log connections are distributed across keys
   */
  static getLogConnection(): Connection {
    if (HeliusConnectionManager.connections.length === 0) {
      // Fallback to first key if available
      const fallbackKey = process.env.HELIUS_API_KEY
      if (fallbackKey) {
        return new Connection(`https://mainnet.helius-rpc.com/?api-key=${fallbackKey}`, 'processed')
      }
      // Last resort fallback
      return new Connection(clusterApiUrl('mainnet-beta'), 'processed')
    }
    
    // FIXED: Capture current index before incrementing to ensure consistency
    const currentIndex = HeliusConnectionManager.logConnectionIndex
    
    // Increment for next call (round-robin)
    HeliusConnectionManager.logConnectionIndex = 
      (HeliusConnectionManager.logConnectionIndex + 1) % HeliusConnectionManager.connections.length
    
    // Return a new connection with 'processed' commitment for logs using the captured index
    const key = HeliusConnectionManager.apiKeys[currentIndex]
    if (!key) {
      // Safety fallback if index is somehow invalid
      const fallbackKey = HeliusConnectionManager.apiKeys[0] || process.env.HELIUS_API_KEY
      if (fallbackKey) {
        return new Connection(`https://mainnet.helius-rpc.com/?api-key=${fallbackKey}`, 'processed')
      }
      return new Connection(clusterApiUrl('mainnet-beta'), 'processed')
    }
    return new Connection(`https://mainnet.helius-rpc.com/?api-key=${key}`, 'processed')
  }

  /**
   * Create multiple log connections for parallel wallet tracking
   * Distributes wallets across different API keys
   */
  static getLogConnectionsForWallets(walletCount: number): Connection[] {
    const connections: Connection[] = []
    const keyCount = HeliusConnectionManager.apiKeys.length

    if (keyCount === 0) {
      // Fallback single connection
      const fallbackKey = process.env.HELIUS_API_KEY
      if (fallbackKey) {
        connections.push(new Connection(`https://mainnet.helius-rpc.com/?api-key=${fallbackKey}`, 'processed'))
      }
      return connections
    }

    // Distribute wallets across keys (round-robin assignment)
    for (let i = 0; i < Math.min(walletCount, keyCount); i++) {
      const key = HeliusConnectionManager.apiKeys[i % keyCount]!
      connections.push(new Connection(`https://mainnet.helius-rpc.com/?api-key=${key}`, 'processed'))
    }

    return connections
  }

  /**
   * Reset all connection indices (useful after errors)
   */
  static resetIndices(): void {
    HeliusConnectionManager.currentIndex = 0
    HeliusConnectionManager.logConnectionIndex = 0
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERAL RPC CONNECTION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

const RPC_ENDPOINTS =
  process.env.RPC_ENDPOINTS?.split(',')
    .map((url) => url.trim())
    .filter(Boolean) ?? []

console.log(chalk.bold.greenBright(`LOADED ${RPC_ENDPOINTS.length} RPC ENDPOINT${RPC_ENDPOINTS.length !== 1 ? 'S' : ''}`))

// Legacy: Single Helius network for backward compatibility
const HELIUS_NETWORK = HELIUS_API_KEYS.length > 0
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEYS[0]}`
  : process.env.HELIUS_API_KEY 
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : ''

// If you are going to use Handi Cat locally you can just use SOLANA_NETWORK for all connections
// and will work fine as long you dont track too many wallets
export class RpcConnectionManager {
  static connections: Connection[] = RPC_ENDPOINTS.length > 0
    ? RPC_ENDPOINTS.map((url) => new Connection(url, 'confirmed'))
    : [new Connection(clusterApiUrl('mainnet-beta'), 'confirmed')]

  // Legacy: Single log connection (use HeliusConnectionManager for multiple)
  static logConnection = HELIUS_NETWORK 
    ? new Connection(HELIUS_NETWORK, 'processed')
    : new Connection(clusterApiUrl('mainnet-beta'), 'processed')

  static getRandomConnection(): Connection {
    if (RpcConnectionManager.connections.length === 0) {
      console.warn('No RPC connections available, using default mainnet connection')
      return new Connection(clusterApiUrl('mainnet-beta'), 'confirmed')
    }
    const randomIndex = Math.floor(Math.random() * RpcConnectionManager.connections.length)
    return RpcConnectionManager.connections[randomIndex]!
  }

  static resetLogConnection() {
    const key = HeliusConnectionManager.getNextApiKey()
    if (key) {
      RpcConnectionManager.logConnection = new Connection(
        `https://mainnet.helius-rpc.com/?api-key=${key}`,
        'processed'
      )
    }
  }
}
