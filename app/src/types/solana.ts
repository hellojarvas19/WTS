// ═══════════════════════════════════════════════════════════════════════════════
// SOLANA TRACKER TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Wallet {
  id: string
  address: string
  name: string
  isActive: boolean
  addedAt: number
}

export interface TokenMetadata {
  // Basic Info
  name: string
  symbol: string
  mint: string
  decimals: number
  description?: string
  image?: string
  
  // Market Data
  priceUsd?: number
  priceSol?: number
  marketCap?: number
  fullyDilutedMarketCap?: number
  liquidity?: number
  volume24h?: number
  priceChange24h?: number
  priceChange1h?: number
  
  // Pool Info
  poolAddress?: string
  poolType?: string
  lpBurned?: boolean
  lpBurnedPercentage?: number
  
  // Supply Info
  totalSupply?: number
  circulatingSupply?: number
  
  // Holders Info
  totalHolders?: number
  top10HoldersPercentage?: number
  
  // Dev/Creator Info
  devWallet?: string
  devWalletHoldingPercentage?: number
  creatorAddress?: string
  
  // Security Info
  mintAuthority?: string | null
  mintAuthorityRevoked?: boolean
  freezeAuthority?: string | null
  freezeAuthorityRevoked?: boolean
  isMutable?: boolean
  
  // Launch Info
  launchTime?: Date
  launchTimestamp?: number
  ageInHours?: number
  
  // Social Links
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  
  // Platform Status
  dexscreenerPaid?: boolean
  pumpfunKingOfTheHill?: boolean
  pumpfunComplete?: boolean
  
  // Risk Indicators
  isRugPull?: boolean
  isHoneypot?: boolean
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
}

export interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  marketCap: number
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  txns: {
    h24: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    m5: { buys: number; sells: number }
  }
  info?: {
    imageUrl?: string
    websites?: { url: string }[]
    socials?: { type: string; url: string }[]
  }
  boosts?: {
    active: number
  }
}

export interface Transaction {
  signature: string
  timestamp: number
  type: 'buy' | 'sell' | 'transfer' | 'mint' | 'unknown'
  platform: 'raydium' | 'jupiter' | 'pumpfun' | 'pumpfun_amm' | 'mint_pumpfun' | 'transfer' | 'unknown'
  owner: string
  description: string
  
  // Token transfers
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
  
  // SOL amount involved
  solAmount?: number
  lamportsAmount?: number
  
  // Market data
  tokenPrice?: number
  marketCap?: number
  solPrice?: number
  
  // Token metadata (fetched separately)
  tokenMetadata?: TokenMetadata
  
  // Status
  isNew?: boolean
  status: 'pending' | 'confirmed' | 'failed'
}

export interface WalletWithTransactions extends Wallet {
  transactions: Transaction[]
  lastUpdated: number
  isLoading: boolean
  error?: string
}

export interface PumpFunTokenData {
  mint: string
  name: string
  symbol: string
  description: string
  image_uri: string
  metadata_uri: string
  twitter?: string
  telegram?: string
  website?: string
  bonding_curve: string
  associated_bonding_curve: string
  creator: string
  created_timestamp: number
  complete: boolean
  virtual_sol_reserves: number
  virtual_token_reserves: number
  total_supply: number
  king_of_the_hill_timestamp?: number
  market_cap: number
  usd_market_cap: number
  reply_count: number
  last_reply?: number
}

export interface BirdeyeTokenData {
  address: string
  decimals: number
  symbol: string
  name: string
  liquidity: number
  price: number
  history24hPrice: number
  priceChange24hPercent: number
  volume24h: number
  volume24hUSD: number
  mc: number
  holder: number
  trade24h: number
  trade24hChangePercent: number
  buy24h: number
  buy24hChangePercent: number
  sell24h: number
  sell24hChangePercent: number
  v24hUSD: number
  v24hChangePercent: number
  lastTradeUnixTime: number
  lastTradeHumanTime: string
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
}

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
  low: 'bg-green-500/10 border-green-500/20',
  medium: 'bg-yellow-500/10 border-yellow-500/20',
  high: 'bg-orange-500/10 border-orange-500/20',
  critical: 'bg-red-500/10 border-red-500/20',
}
