/**
 * GMGN Apify Actor Types
 * For fetching trading signals, risk analysis, and smart wallet data
 * Can be used via Apify Actor or direct GMGN API when available
 */

/**
 * GMGN Token Security Info
 */
export interface GmgnTokenSecurity {
  // Mint/Freeze authority flags
  is_mint_renounced: boolean // renounced_mint in API
  is_freeze_renounced: boolean // renounced_freeze_account in API
  
  // Ownership risks
  top_10_holder_rate: number // Percentage held by top 10
  creator_percentage: string // Creator/dev holding percentage
  creator_close: boolean // If creator closed their position
  creator_token_status: string // 'sell' | 'hold' | 'buy' etc.
  
  // LP/Pool safety
  burn_ratio: string // LP burn ratio
  burn_status: string // 'burned' | 'not_burned' | 'partial'
  
  // Honeypot/Rug detection
  is_honeypot: boolean | null
  buy_tax: number | null
  sell_tax: number | null
  rug_ratio: number // Risk of rug based on historical data
  
  // Additional flags
  is_show_alert: boolean
  hot_level: number
}

/**
 * GMGN Token Pool/Liquidity Info
 */
export interface GmgnPoolInfo {
  address: string // Pool address
  quote_address: string
  quote_symbol: string
  liquidity: number // Current liquidity
  base_reserve: string
  quote_reserve: string
  initial_liquidity: number
  initial_base_reserve: string
  initial_quote_reserve: string
  creation_timestamp: number
  base_reserve_value: number
  quote_reserve_value: number
}

/**
 * GMGN Token Trading Stats
 */
export interface GmgnTradingStats {
  // Volume metrics
  volume_5m: number
  volume_1h: number
  volume_6h: number
  volume_24h: number
  
  // Buy volume
  buy_volume_5m: number
  buy_volume_1h: number
  buy_volume_6h: number
  buy_volume_24h: number
  
  // Sell volume
  sell_volume_5m: number
  sell_volume_1h: number
  sell_volume_6h: number
  sell_volume_24h: number
  
  // Net in/out flow
  net_in_volume_5m: number
  net_in_volume_1h: number
  net_in_volume_6h: number
  net_in_volume_24h: number
  
  // Swap counts
  swaps_5m: number
  swaps_1h: number
  swaps_6h: number
  swaps_24h: number
  
  // Buy/Sell counts
  buys_5m: number
  sells_5m: number
  buys_1h: number
  sells_1h: number
  buys_6h: number
  sells_6h: number
  buys_24h: number
  sells_24h: number
}

/**
 * GMGN Price History
 */
export interface GmgnPriceHistory {
  price: number
  price_1m: number
  price_5m: number
  price_1h: number
  price_6h: number
  price_24h: number
  high_price: number | null
  high_price_timestamp: number | null
  low_price: number | null
  low_price_timestamp: number | null
}

/**
 * GMGN Creator/Developer Info
 */
export interface GmgnCreatorInfo {
  creator_address: string
  creator_balance: number // SOL balance
  creator_token_balance: string
  creator_close: boolean
  creator_percentage: string
  creator_token_status: string
  dev_token_burn_amount: number | null
  dev_token_burn_ratio: number | null
}

/**
 * GMGN Rugged Token Info (tokens creator previously rugged)
 */
export interface GmgnRuggedToken {
  address: string
  name: string
  symbol: string
  logo: string
}

/**
 * GMGN Social Links
 */
export interface GmgnSocialLinks {
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  geckoterminal?: string
  gmgn?: string
}

/**
 * GMGN Complete Token Response
 * Matches the existing PumpDetail interface but with additional fields
 */
export interface GmgnTokenData {
  // Basic info
  address: string
  symbol: string
  name: string
  decimals: number
  logo: string
  chain: string
  
  // Market data
  price: number
  market_cap: number
  fdv: number
  circulating_market_cap: number | null
  liquidity: number
  max_supply: number
  total_supply: number
  circulating_supply: number | null
  holder_count: number
  biggest_pool_address: string
  
  // Timestamps
  creation_timestamp: number
  open_timestamp: number | null
  
  // Price history
  price_history: GmgnPriceHistory
  
  // Trading stats
  trading_stats: GmgnTradingStats
  
  // Security info
  security: GmgnTokenSecurity
  
  // Pool info
  pool_info: GmgnPoolInfo
  
  // Creator info
  creator: GmgnCreatorInfo
  
  // Social links
  social_links: GmgnSocialLinks
  link: {
    geckoterminal: string
    gmgn: string
  }
  
  // Hot level indicator
  hot_level: number
  
  // Launchpad info (PumpFun)
  launchpad: string
  launchpad_status: number // 0 = bonding, 1 = graduated
  launchpad_progress: number // 0-100 bonding curve progress
  
  // Rug history
  holder_rugged_num: number
  holder_token_num: number
  rugged_tokens: GmgnRuggedToken[]
  
  // Twitter changes (name change history - sign of potential scam)
  twitter_name_change_history: string[]
  
  // DexScreener paid ads
  dexscr_ad: number
  dexscr_update_link: number
  
  // Community takeover flag
  cto_flag: number
  
  // Ranking
  swap_rank: number | null
}

/**
 * GMGN API Response wrapper
 */
export interface GmgnApiResponse<T> {
  code: number
  msg: string
  data: T
}

/**
 * GMGN Smart Wallet Info
 * Tracks known profitable/smart money wallets
 */
export interface GmgnSmartWallet {
  address: string
  name: string | null
  twitter_username: string | null
  twitter_name: string | null
  tags: string[] // 'smart_money', 'whale', 'degen', etc.
  winrate: number
  pnl: number
  pnl_7d: number
  pnl_30d: number
  realized_profit: number
  realized_profit_7d: number
  realized_profit_30d: number
  total_value: number
  sol_balance: string
  token_num: number
  profit_num: number
  last_active_timestamp: number
  followers_count: number
  is_contract: boolean
}

/**
 * GMGN Token Holder with Smart Wallet Tags
 */
export interface GmgnTokenHolder {
  address: string
  balance: number
  percentage: number
  tags: string[] // 'dev', 'smart_money', 'whale', 'insider', etc.
  is_smart_wallet: boolean
  wallet_info?: GmgnSmartWallet
}

/**
 * GMGN New Pairs/Trending Response
 */
export interface GmgnNewPair {
  address: string
  symbol: string
  name: string
  logo: string
  price: number
  market_cap: number
  liquidity: number
  volume_24h: number
  holder_count: number
  creation_timestamp: number
  launchpad: string
  launchpad_status: number
  buy_volume_5m: number
  sell_volume_5m: number
  hot_level: number
}

/**
 * Apify Actor Input for GMGN Scraper
 */
export interface GmgnApifyInput {
  tokenAddress: string
  includeHolders?: boolean
  includeSmartWallets?: boolean
  includeNewPairs?: boolean
}

/**
 * Apify Actor Output
 */
export interface GmgnApifyOutput {
  success: boolean
  tokenData?: GmgnTokenData
  holders?: GmgnTokenHolder[]
  smartWalletActivity?: GmgnSmartWallet[]
  newPairs?: GmgnNewPair[]
  error?: string
  timestamp: number
}

/**
 * Parsed GMGN data for unified interface
 */
export interface ParsedGmgnData {
  // Risk Assessment
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  riskFactors: string[]
  
  // Security Flags
  mintRenounced: boolean
  freezeRenounced: boolean
  lpBurned: boolean
  lpBurnPercentage: number
  
  // Holder Analysis
  top10HoldersPercentage: number
  holderCount: number
  smartWalletHolders: number
  insiderHolders: number
  
  // Creator/Dev Analysis
  devWallet: string
  devHoldingPercentage: number
  devSoldAll: boolean
  devStatus: string // 'holding' | 'sold' | 'buying'
  devRugHistory: GmgnRuggedToken[]
  
  // Trading Signals
  buyPressure: number // buy_volume / sell_volume ratio
  netFlow24h: number
  volume24h: number
  volumeChange: number // Compared to previous period
  
  // Market Data
  price: number
  marketCap: number
  liquidity: number
  liquidityRatio: number // liquidity / market_cap
  
  // Platform Status
  launchpad: string
  bondingComplete: boolean
  bondingProgress: number
  
  // Social/Trust Indicators
  dexscreenerPaid: boolean
  twitterNameChanges: number
  ctoCommunityTakeover: boolean
  hotLevel: number
  
  // Timestamps
  createdAt: number
  ageInHours: number
}

/**
 * GMGN Signal Types for trading decisions
 */
export type GmgnSignalType = 
  | 'smart_money_buy'
  | 'smart_money_sell'
  | 'whale_accumulation'
  | 'whale_distribution'
  | 'dev_selling'
  | 'high_buy_pressure'
  | 'high_sell_pressure'
  | 'new_listing'
  | 'bonding_complete'
  | 'rug_warning'
  | 'honeypot_detected'

export interface GmgnSignal {
  type: GmgnSignalType
  strength: 'weak' | 'moderate' | 'strong'
  message: string
  timestamp: number
  data?: Record<string, any>
}
