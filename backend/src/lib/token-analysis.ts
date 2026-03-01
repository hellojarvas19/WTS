import axios from 'axios'
import { Connection, PublicKey } from '@solana/web3.js'
// @ts-expect-error
import { getMint, getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { RpcConnectionManager, HeliusConnectionManager } from '../providers/solana'
import {
  HeliusDASAsset,
  HeliusDASGetAssetResponse,
  HeliusTokenMetadata,
  ParsedHeliusData,
} from '../types/helius-das-types'
import {
  GmgnTokenData,
  GmgnApiResponse,
  ParsedGmgnData,
  GmgnSignal,
  GmgnSignalType,
  GmgnTokenHolder,
} from '../types/gmgn-apify-types'
import { DexScreenerPair } from './token-metadata'

/**
 * Unified Token Analysis Response
 * Combines data from all sources into a single comprehensive interface
 */
export interface TokenAnalysisResult {
  // ═══════════════════════════════════════════════════════════════════════════
  // BASIC TOKEN INFO
  // ═══════════════════════════════════════════════════════════════════════════
  mint: string
  name: string
  symbol: string
  decimals: number
  description?: string
  image?: string
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET DATA (from Moralis + DexScreener + GMGN)
  // ═══════════════════════════════════════════════════════════════════════════
  priceUsd: number
  priceSol?: number
  marketCap: number
  fullyDilutedMarketCap?: number
  liquidity: number
  liquidityRatio?: number // liquidity / marketCap
  volume24h: number
  volumeChange24h?: number
  priceChange1h?: number
  priceChange24h?: number
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HOLDER DATA (from Moralis + GMGN + RPC)
  // ═══════════════════════════════════════════════════════════════════════════
  totalHolders: number
  top10HoldersPercentage: number
  topHolders?: TokenHolder[]
  smartWalletHolders?: number
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DEV/CREATOR INFO (from GMGN + Helius + RPC)
  // ═══════════════════════════════════════════════════════════════════════════
  devWallet?: string
  devHoldingPercentage?: number
  devStatus?: 'holding' | 'sold' | 'buying' | 'unknown'
  devRugHistory?: Array<{ address: string; name: string; symbol: string }>
  creatorAddress?: string
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY INFO (from Helius + Solana RPC + GMGN)
  // ═══════════════════════════════════════════════════════════════════════════
  mintAuthority: string | null
  mintAuthorityRevoked: boolean
  freezeAuthority: string | null
  freezeAuthorityRevoked: boolean
  updateAuthority?: string | null
  isMutable?: boolean
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LP INFO (from DexScreener + GMGN + RPC)
  // ═══════════════════════════════════════════════════════════════════════════
  lpBurned: boolean
  lpBurnedPercentage?: number
  poolAddress?: string
  poolType?: string // 'raydium' | 'pumpfun' | 'orca' | 'meteora' | 'pumpswap'
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SOCIAL LINKS (from Helius metadata + DexScreener)
  // ═══════════════════════════════════════════════════════════════════════════
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TRADING SIGNALS (from GMGN)
  // ═══════════════════════════════════════════════════════════════════════════
  buyPressure?: number // buy_volume / sell_volume
  netFlow24h?: number
  signals?: GmgnSignal[]
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RISK ASSESSMENT (combined from all sources)
  // ═══════════════════════════════════════════════════════════════════════════
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  riskFactors: string[]
  isHoneypot?: boolean
  buyTax?: number
  sellTax?: number
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLATFORM STATUS (from GMGN + DexScreener)
  // ═══════════════════════════════════════════════════════════════════════════
  launchpad?: string
  pumpfunComplete?: boolean
  pumpfunProgress?: number
  pumpfunKingOfTheHill?: boolean
  dexscreenerPaid?: boolean
  hotLevel?: number
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS & AGE
  // ═══════════════════════════════════════════════════════════════════════════
  launchTimestamp?: number
  launchTime?: Date
  ageInHours?: number
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLY INFO (from Helius/RPC)
  // ═══════════════════════════════════════════════════════════════════════════
  totalSupply?: number
  circulatingSupply?: number
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DATA SOURCE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  dataSources: string[]
  fetchTimestamp: number
  cacheExpiry?: number
}

export interface TokenHolder {
  address: string
  balance: number
  percentage: number
  isDevWallet?: boolean
  isLpPair?: boolean
  isSmartWallet?: boolean
  tags?: string[]
}

/**
 * Moralis Token Pair Response
 */
interface MoralisTokenPair {
  exchangeAddress: string
  exchangeName: string
  pairAddress: string
  pairLabel: string
  usdPrice: number
  liquidityUsd?: number
}

/**
 * Moralis Token Price Response
 */
interface MoralisTokenPrice {
  usdPrice: number
  percentChange24h?: number
  exchangeName?: string
}

/**
 * Moralis Token Metadata Response
 */
interface MoralisTokenMetadata {
  mint: string
  name: string
  symbol: string
  decimals: number
  logo?: string
  metaplex?: {
    metadataUri?: string
    updateAuthority?: string
    isMutable?: boolean
  }
}

/**
 * Token Analysis Service
 * 
 * Combines data from multiple sources for complete Solana token analysis:
 * - Helius DAS: Full metadata, authorities, verified price
 * - Moralis: DEX pairs, holders count, real-time price
 * - GMGN (via Apify): Trading signals, risk analysis, smart wallets
 * - DexScreener: Real-time pairs, charts, LP status
 * - Solana RPC: On-chain verification, account info
 */
export class TokenAnalysisService {
  private connection: Connection
  private cache: Map<string, { data: TokenAnalysisResult; expiry: number }> = new Map()
  private readonly CACHE_TTL = 60000 // 1 minute cache
  private readonly MAX_CACHE_SIZE = 500 // Maximum entries to prevent memory leak
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(connection?: Connection) {
    this.connection = connection || RpcConnectionManager.getRandomConnection()
    
    // Start periodic cache cleanup every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000)
    
    // Ensure cleanup interval doesn't prevent process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Clean up expired cache entries to prevent memory leaks
   * Also enforces maximum cache size by removing oldest entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now()
    let removedCount = 0
    
    // Remove expired entries
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key)
        removedCount++
      }
    }
    
    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].expiry - b[1].expiry)
      
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE)
      for (const [key] of toRemove) {
        this.cache.delete(key)
        removedCount++
      }
    }
    
    if (removedCount > 0) {
      console.log(`TokenAnalysisService: Cleaned up ${removedCount} cache entries, ${this.cache.size} remaining`)
    }
  }

  /**
   * Destroy the service and clean up resources
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }

  /**
   * Analyze a token by fetching data from all available sources in parallel
   */
  public async analyzeToken(tokenMint: string): Promise<TokenAnalysisResult> {
    // Check cache first
    const cached = this.cache.get(tokenMint)
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }

    // Initialize result with defaults
    let result: TokenAnalysisResult = {
      mint: tokenMint,
      name: '',
      symbol: '',
      decimals: 0,
      priceUsd: 0,
      marketCap: 0,
      liquidity: 0,
      volume24h: 0,
      totalHolders: 0,
      top10HoldersPercentage: 0,
      mintAuthority: null,
      mintAuthorityRevoked: true,
      freezeAuthority: null,
      freezeAuthorityRevoked: true,
      lpBurned: false,
      riskLevel: 'medium',
      riskScore: 50,
      riskFactors: [],
      dataSources: [],
      fetchTimestamp: Date.now(),
    }

    // Fetch from all sources in parallel
    const [
      birdeyeData,
      heliusData,
      moralisData,
      gmgnData,
      dexscreenerData,
      rpcData,
      rugcheckData,
      jupiterData,
      pumpfunData,
      solanaTrackerHolders,
    ] = await Promise.allSettled([
      this.fetchBirdeyeData(tokenMint),
      this.fetchHeliusDAS(tokenMint),
      this.fetchMoralisData(tokenMint),
      this.fetchGmgnData(tokenMint),
      this.fetchDexScreenerData(tokenMint),
      this.fetchSolanaRpcData(tokenMint),
      this.tryRugCheckApi(tokenMint),
      this.tryJupiterPrice(tokenMint),
      this.fetchPumpFunData(tokenMint),
      this.fetchSolanaTrackerHolders(tokenMint),
    ])

    // Merge Birdeye data (highest priority for market cap and liquidity)
    if (birdeyeData.status === 'fulfilled' && birdeyeData.value) {
      result = this.mergeBirdeyeData(result, birdeyeData.value)
      result.dataSources.push('birdeye')
    }

    // Merge Helius DAS data (highest priority for metadata and authorities)
    if (heliusData.status === 'fulfilled' && heliusData.value) {
      result = this.mergeHeliusData(result, heliusData.value)
      result.dataSources.push('helius')
    }

    // Merge Solana RPC data (authoritative for on-chain state)
    if (rpcData.status === 'fulfilled' && rpcData.value) {
      result = this.mergeRpcData(result, rpcData.value)
      result.dataSources.push('solana-rpc')
    }

    // Merge Moralis data (DEX pairs, holders, price)
    if (moralisData.status === 'fulfilled' && moralisData.value) {
      result = this.mergeMoralisData(result, moralisData.value)
      result.dataSources.push('moralis')
    }

    // Merge DexScreener data (real-time pairs, LP status)
    if (dexscreenerData.status === 'fulfilled' && dexscreenerData.value) {
      result = this.mergeDexScreenerData(result, dexscreenerData.value)
      result.dataSources.push('dexscreener')
    }

    // Merge GMGN data (trading signals, risk analysis) - Last to override risk assessment
    if (gmgnData.status === 'fulfilled' && gmgnData.value) {
      result = this.mergeGmgnData(result, gmgnData.value)
      result.dataSources.push('gmgn')
    }

    // Merge RugCheck data (additional security verification)
    if (rugcheckData.status === 'fulfilled' && rugcheckData.value) {
      result = this.mergeRugCheckData(result, rugcheckData.value)
      result.dataSources.push('rugcheck')
    }

    // Merge Solana Tracker holders data (highest priority for holder info)
    if (solanaTrackerHolders.status === 'fulfilled' && solanaTrackerHolders.value) {
      result.topHolders = solanaTrackerHolders.value.topHolders
      result.top10HoldersPercentage = solanaTrackerHolders.value.top10Percentage
      if (solanaTrackerHolders.value.totalHolders > 0) {
        result.totalHolders = solanaTrackerHolders.value.totalHolders
      }
      result.dataSources.push('solanatracker')
    }

    // Merge Jupiter price data (fallback price source)
    if (jupiterData.status === 'fulfilled' && jupiterData.value) {
      if (!result.priceUsd || result.priceUsd === 0) {
        result.priceUsd = jupiterData.value.priceUsd
        result.priceSol = jupiterData.value.priceSol
      }
      result.dataSources.push('jupiter')
    }

    // Merge PumpFun data (bonding curve, creation time, dev wallet)
    if (pumpfunData.status === 'fulfilled' && pumpfunData.value) {
      result = this.mergePumpFunData(result, pumpfunData.value)
      result.dataSources.push('pumpfun')
    }

    // Calculate final risk assessment
    result = this.calculateRiskAssessment(result)

    // Calculate age if launch timestamp available
    if (result.launchTimestamp) {
      result.ageInHours = (Date.now() - result.launchTimestamp) / (1000 * 60 * 60)
      result.launchTime = new Date(result.launchTimestamp)
    }

    // Calculate liquidity ratio
    if (result.liquidity > 0 && result.marketCap > 0) {
      result.liquidityRatio = result.liquidity / result.marketCap
    }

    // Cache the result
    this.cache.set(tokenMint, {
      data: result,
      expiry: Date.now() + this.CACHE_TTL,
    })

    return result
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA FETCHERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fetch token data from Birdeye API (Primary source for market cap & liquidity)
   */
  private async fetchBirdeyeData(tokenMint: string): Promise<{
    priceUsd: number
    marketCap: number
    liquidity: number
    volume24h: number
    priceChange24h: number
  } | null> {
    const apiKey = process.env.BIRDEYE_API_KEY
    if (!apiKey) return null

    try {
      const response = await axios.get(
        `https://public-api.birdeye.so/defi/token_overview?address=${tokenMint}`,
        {
          timeout: 10000,
          headers: {
            'X-API-KEY': apiKey,
            'Accept': 'application/json',
          },
        }
      )

      const data = response.data?.data
      if (!data) return null

      return {
        priceUsd: data.price || data.priceUsd || 0,
        marketCap: data.mc || data.marketCap || data.market_cap || 0,
        liquidity: data.liquidity || 0,
        volume24h: data.v24hUSD || data.volume24h || data.volume_24h_usd || 0,
        priceChange24h: data.priceChange24h || data.price_change_24h_percent || 0,
      }
    } catch (error: any) {
      // Log error for debugging but don't crash
      if (error.response?.status === 401) {
        console.log('Birdeye API: Invalid API key')
      } else if (error.response?.status === 429) {
        console.log('Birdeye API: Rate limit exceeded')
      } else if (error.code === 'ECONNABORTED') {
        console.log('Birdeye API: Request timeout')
      }
      return null
    }
  }

  /**
   * Fetch token data from Helius DAS API
   * Uses round-robin API key selection for load balancing
   */
  private async fetchHeliusDAS(tokenMint: string): Promise<ParsedHeliusData | null> {
    // Use HeliusConnectionManager for round-robin key selection
    const apiKey = HeliusConnectionManager.getNextApiKey() || process.env.HELIUS_API_KEY
    if (!apiKey) return null

    try {
      // Use DAS getAsset for comprehensive token data
      const response = await axios.post<HeliusDASGetAssetResponse>(
        `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
        {
          jsonrpc: '2.0',
          id: 'helius-das',
          method: 'getAsset',
          params: {
            id: tokenMint,
            displayOptions: {
              showFungible: true,
            },
          },
        },
        { timeout: 10000 }
      )

      const asset = response.data?.result
      if (!asset) return null

      // Parse authorities
      const mintAuth = asset.token_info?.mint_authority || null
      const freezeAuth = asset.token_info?.freeze_authority || null
      const updateAuth = asset.authorities?.find(a => a.scopes.includes('update'))?.address || null

      // Parse social links from metadata
      const metadata = asset.content?.metadata
      const links = asset.content?.links
      let socialLinks: Record<string, string> = {}
      
      // Try to fetch off-chain metadata for social links
      if (asset.content?.json_uri) {
        try {
          const metadataRes = await axios.get(asset.content.json_uri, { timeout: 5000 })
          const offChainMeta = metadataRes.data
          if (offChainMeta) {
            socialLinks = {
              website: offChainMeta.external_url || offChainMeta.website,
              twitter: offChainMeta.twitter,
              telegram: offChainMeta.telegram,
              discord: offChainMeta.discord,
            }
          }
        } catch {
          // Silently handle off-chain metadata fetch errors
        }
      }

      return {
        name: metadata?.name?.replace(/\x00/g, '') || '',
        symbol: metadata?.symbol?.replace(/\x00/g, '') || '',
        description: metadata?.description,
        image: links?.image || asset.content?.files?.[0]?.cdn_uri || asset.content?.files?.[0]?.uri,
        mintAuthority: mintAuth,
        freezeAuthority: freezeAuth,
        updateAuthority: updateAuth,
        decimals: asset.token_info?.decimals || 0,
        totalSupply: asset.token_info?.supply || 0,
        creators: asset.creators || [],
        isMutable: asset.mutable,
        priceUsd: asset.token_info?.price_info?.price_per_token,
        burnt: asset.burnt,
        frozen: asset.ownership?.frozen || false,
        ...socialLinks,
      }
    } catch (error: any) {
      // Log only unexpected errors
      if (error?.response?.status !== 404) {
        console.log('Helius DAS fetch error:', error?.code || error?.response?.status || 'unknown')
      }
      return null
    }
  }

  /**
   * Fetch holders data from Solana Tracker API
   */
  private async fetchSolanaTrackerHolders(tokenMint: string): Promise<{
    topHolders: TokenHolder[]
    top10Percentage: number
    totalHolders: number
  } | null> {
    const apiKey = process.env.SOLANA_TRACKER_API_KEY
    
    if (!apiKey) {
      console.log('⚠️  Solana Tracker: API key not set')
      return null
    }

    try {
      // Fetch token info - provides holders count and top10%
      const data = await this.fetchWithRetry(
        `https://data.solanatracker.io/tokens/${tokenMint}`,
        apiKey
      )

      if (!data) {
        console.log(`⚠️  Solana Tracker: No data for ${tokenMint.slice(0, 8)}...`)
        return null
      }

      const totalHolders = data.holders || 0
      const top10Percentage = data.risk?.top10 || 0

      if (totalHolders === 0 && top10Percentage === 0) {
        console.log(`⚠️  Solana Tracker: Token ${tokenMint.slice(0, 8)}... has no holder data`)
      }

      return {
        topHolders: [],
        top10Percentage,
        totalHolders,
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('❌ Solana Tracker: Invalid API key')
      } else if (error.response?.status === 403) {
        console.log(`❌ Solana Tracker: Access forbidden for ${tokenMint.slice(0, 8)}...`)
      } else if (error.response?.status === 404) {
        console.log(`⚠️  Solana Tracker: Token ${tokenMint.slice(0, 8)}... not found`)
      } else if (error.response?.status === 429) {
        console.log('⚠️  Solana Tracker: Rate limit exceeded')
      } else if (error.code === 'ECONNABORTED') {
        console.log('⚠️  Solana Tracker: Request timeout')
      } else {
        console.log(`⚠️  Solana Tracker error: ${error.message}`)
      }
      return null
    }
  }

  /**
   * Fetch with retry logic for rate limits
   */
  private async fetchWithRetry(url: string, apiKey: string, retries = 2): Promise<any> {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'x-api-key': apiKey,
            'Accept': 'application/json',
          },
        })
        return response.data
      } catch (error: any) {
        if (error.response?.status === 429 && i < retries) {
          // Rate limited - wait and retry
          const waitTime = Math.pow(2, i) * 1000 // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        throw error
      }
    }
  }

  /**
   * Fetch token data from Moralis API
   */
  private async fetchMoralisData(tokenMint: string): Promise<{
    metadata: MoralisTokenMetadata | null
    price: MoralisTokenPrice | null
    pairs: MoralisTokenPair[]
    holders: number
  } | null> {
    const apiKey = process.env.MORALIS_API_KEY
    if (!apiKey) return null

    const headers = {
      'Accept': 'application/json',
      'X-API-Key': apiKey,
    }

    try {
      // Fetch metadata, price, and pairs in parallel
      const [metadataRes, priceRes, pairsRes] = await Promise.allSettled([
        axios.get<MoralisTokenMetadata>(
          `https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/metadata`,
          { timeout: 10000, headers }
        ),
        axios.get<MoralisTokenPrice>(
          `https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/price`,
          { timeout: 10000, headers }
        ),
        axios.get(
          `https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/pairs`,
          { timeout: 10000, headers }
        ),
      ])

      const metadata = metadataRes.status === 'fulfilled' ? metadataRes.value.data : null
      const price = priceRes.status === 'fulfilled' ? priceRes.value.data : null
      const pairsData = pairsRes.status === 'fulfilled' ? pairsRes.value.data : null
      const pairs: MoralisTokenPair[] = Array.isArray(pairsData) ? pairsData : (pairsData?.pairs || [])

      // Try to get holder count (Moralis may provide this)
      let holders = 0
      try {
        const holdersRes = await axios.get(
          `https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/holders`,
          { timeout: 5000, headers }
        )
        if (holdersRes.data?.total) {
          holders = holdersRes.data.total
        }
      } catch {
        // Holders endpoint may not be available for all tokens
      }

      if (!metadata && !price && pairs.length === 0) {
        return null
      }

      return { metadata, price, pairs, holders }
    } catch {
      return null
    }
  }

  /**
   * Fetch token data from GMGN API
   * Uses direct API when available, falls back to cached/Apify data
   */
  private async fetchGmgnData(tokenMint: string): Promise<ParsedGmgnData | null> {
    // Try direct GMGN API first
    const gmgnData = await this.tryDirectGmgnApi(tokenMint)
    if (gmgnData) {
      return this.parseGmgnData(gmgnData)
    }

    // Try Apify Actor if direct API fails
    const apifyData = await this.tryGmgnApify(tokenMint)
    if (apifyData) {
      return this.parseGmgnData(apifyData)
    }

    return null
  }

  /**
   * Try direct GMGN API
   */
  private async tryDirectGmgnApi(tokenMint: string): Promise<GmgnTokenData | null> {
    try {
      const response = await axios.get<GmgnApiResponse<GmgnTokenData>>(
        `https://gmgn.ai/defi/quotation/v1/tokens/sol/${tokenMint}`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Origin': 'https://gmgn.ai',
            'Referer': 'https://gmgn.ai/',
          },
        }
      )

      if (response.data?.code === 0 && response.data?.data) {
        return response.data.data
      }
      return null
    } catch {
      // GMGN API may be blocked by Cloudflare
      return null
    }
  }

  /**
   * Try GMGN via Apify Actor (optional - most data available from other sources)
   * 
   * Note: Apify integration is optional. The analysis system works well without it
   * using Helius, Moralis, DexScreener, and Solana RPC data.
   * 
   * If you want to use Apify, you can:
   * 1. Create your own actor at https://apify.com
   * 2. Use the GMGN public API when available (tried first in tryDirectGmgnApi)
   */
  private async tryGmgnApify(tokenMint: string): Promise<GmgnTokenData | null> {
    const apifyToken = process.env.APIFY_API_TOKEN
    const gmgnActorId = process.env.GMGN_APIFY_ACTOR_ID

    // Skip if not configured - this is optional
    if (!apifyToken || !gmgnActorId) {
      return null
    }

    try {
      // Run the Apify actor
      const response = await axios.post(
        `https://api.apify.com/v2/acts/${gmgnActorId}/runs?token=${apifyToken}`,
        {
          tokenAddress: tokenMint,
          includeHolders: true,
        },
        { timeout: 30000 }
      )

      // Wait for run to complete and get results
      if (response.data?.data?.id) {
        const runId = response.data.data.id
        
        // Poll for completion (max 30 seconds)
        for (let i = 0; i < 6; i++) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          const statusRes = await axios.get(
            `https://api.apify.com/v2/acts/${gmgnActorId}/runs/${runId}?token=${apifyToken}`
          )
          
          if (statusRes.data?.data?.status === 'SUCCEEDED') {
            const datasetRes = await axios.get(
              `https://api.apify.com/v2/acts/${gmgnActorId}/runs/${runId}/dataset/items?token=${apifyToken}`
            )
            
            if (datasetRes.data?.[0]?.tokenData) {
              return datasetRes.data[0].tokenData
            }
          }
        }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Try RugCheck API for additional security data
   * Free API that provides mint/freeze authority, risk scores, LP info, and holder data
   */
  private async tryRugCheckApi(tokenMint: string): Promise<{
    mintAuthorityRevoked: boolean
    freezeAuthorityRevoked: boolean
    riskScore: number
    risks: string[]
    lpLocked: boolean
    lpLockedPercentage: number
    totalHolders: number
    topHolders: TokenHolder[]
    top10HoldersPercentage: number
    totalLiquidityUsd: number
  } | null> {
    try {
      const response = await axios.get(
        `https://api.rugcheck.xyz/v1/tokens/${tokenMint}/report`,
        { timeout: 10000 }
      )

      if (response.data) {
        const data = response.data

        // Extract LP lock info from markets
        let lpLocked = false
        let lpLockedPercentage = 0
        let totalLiquidityUsd = 0
        if (data.markets && Array.isArray(data.markets)) {
          for (const market of data.markets) {
            const lockedPct = market.lp?.lpLockedPct || 0
            const quoteUsd = market.lp?.quoteUSD || 0
            totalLiquidityUsd += quoteUsd
            if (lockedPct > lpLockedPercentage) {
              lpLockedPercentage = lockedPct
            }
          }
          lpLocked = lpLockedPercentage >= 90 // Consider LP "burned" if >= 90% locked
        }

        // Extract top holders data
        // Filter out known pool/bonding curve accounts for accurate holder metrics
        const topHolders: TokenHolder[] = []
        let top10HoldersPercentage = 0
        // RugCheck only returns top 20 accounts, not total holder count
        // Don't use this as totalHolders - it will be misleadingly low
        const totalHolders = 0 // Will be populated from other sources or left as 0
        
        // Known PumpFun/pool associated accounts to filter
        const poolPatterns = [
          '5Q544fKr', // PumpFun fee account prefix
          '39azUYFW', // PumpFun migration prefix
        ]
        
        // Collect market pool addresses to filter
        const marketPoolAddresses = new Set<string>()
        if (data.markets && Array.isArray(data.markets)) {
          for (const market of data.markets) {
            // Pool LP mint and base/quote vaults
            if (market.lp?.lpMint) marketPoolAddresses.add(market.lp.lpMint)
            if (market.pubkey) marketPoolAddresses.add(market.pubkey)
            // PumpFun bonding curve associated accounts
            if (market.marketType === 'pump_fun' || market.marketType === 'pump_fun_amm') {
              if (market.mintA) marketPoolAddresses.add(market.mintA)
              if (market.mintB) marketPoolAddresses.add(market.mintB)
            }
          }
        }
        
        if (data.topHolders && Array.isArray(data.topHolders)) {
          for (const holder of data.topHolders.slice(0, 20)) {
            const addr = holder.address || ''
            const pct = holder.pct || 0
            
            // Detect if this is a pool/bonding curve account
            const isPool = marketPoolAddresses.has(addr) ||
              poolPatterns.some(p => addr.startsWith(p)) ||
              (pct > 30 && !holder.insider) // Very large single holder likely a pool
            
            topHolders.push({
              address: addr,
              balance: holder.amount || 0,
              percentage: pct,
              isDevWallet: holder.insider === true,
              isLpPair: isPool,
            })
          }
          
          // Calculate top 10 percentage EXCLUDING pool accounts
          const realHolders = topHolders.filter(h => !h.isLpPair)
          top10HoldersPercentage = realHolders
            .slice(0, 10)
            .reduce((sum, h) => sum + h.percentage, 0)
        }

        return {
          mintAuthorityRevoked: data.mintAuthority === null,
          freezeAuthorityRevoked: data.freezeAuthority === null,
          riskScore: data.score || 0,
          risks: data.risks?.map((r: any) => r.description) || [],
          lpLocked,
          lpLockedPercentage,
          totalHolders,
          topHolders,
          top10HoldersPercentage,
          totalLiquidityUsd,
        }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Try Jupiter API for price data
   * Note: Jupiter v6 price endpoint is deprecated. Uses v2 API with optional API key,
   * falls back to DexScreener price if Jupiter is unavailable.
   */
  private async tryJupiterPrice(tokenMint: string): Promise<{
    priceUsd: number
    priceSol: number
  } | null> {
    // Try Jupiter v2 API (may require API key)
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' }
      const jupiterApiKey = process.env.JUPITER_API_KEY
      if (jupiterApiKey) {
        headers['Authorization'] = `Bearer ${jupiterApiKey}`
      }

      const response = await axios.get(
        `https://api.jup.ag/price/v2?ids=${tokenMint}`,
        { timeout: 5000, headers }
      )

      if (response.data?.data?.[tokenMint]) {
        const data = response.data.data[tokenMint]
        const priceUsd = parseFloat(data.price) || 0

        // Safer division with explicit checks for NaN, null, undefined, and zero
        let priceSol = 0
        const vsTokenPrice = data.vsTokenPrice
        if (typeof vsTokenPrice === 'number' && isFinite(vsTokenPrice) && vsTokenPrice > 0) {
          priceSol = priceUsd / vsTokenPrice
        }

        // Final NaN check
        if (!isFinite(priceSol)) {
          priceSol = 0
        }

        return { priceUsd, priceSol }
      }
    } catch {
      // Jupiter API may require API key or be unavailable - this is expected
    }

    // Fallback: Try Raydium price API (free, no key required)
    try {
      const response = await axios.get(
        `https://api-v3.raydium.io/mint/price?mints=${tokenMint}`,
        { timeout: 5000 }
      )

      if (response.data?.success && response.data?.data?.[tokenMint]) {
        const priceUsd = parseFloat(response.data.data[tokenMint]) || 0
        if (priceUsd > 0) {
          return { priceUsd, priceSol: 0 }
        }
      }
    } catch {
      // Raydium API may not have price for this token
    }

    return null
  }

  /**
   * Fetch data from PumpFun API
   * Provides creation timestamp, bonding curve status, and dev wallet info
   */
  private async fetchPumpFunData(tokenMint: string): Promise<{
    name: string
    symbol: string
    description: string
    image: string
    creator: string
    createdTimestamp: number
    complete: boolean
    marketCap: number
    usdMarketCap: number
    virtualSolReserves: number
    virtualTokenReserves: number
    totalSupply: number
    website?: string
    twitter?: string
    telegram?: string
    bondingProgress: number
  } | null> {
    try {
      const response = await axios.get(
        `https://frontend-api-v3.pump.fun/coins/${tokenMint}`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
            'Accept': '*/*',
            'Origin': 'https://www.pump.fun',
            'Referer': 'https://www.pump.fun/',
          },
        }
      )

      if (response.status === 200 && response.data) {
        const data = response.data
        
        // Calculate bonding curve progress
        // PumpFun bonding curve completes when virtual_sol_reserves reaches ~85 SOL
        const virtualSol = data.virtual_sol_reserves || 0
        const bondingProgress = Math.min(100, (virtualSol / 85e9) * 100)
        
        return {
          name: data.name || '',
          symbol: data.symbol || '',
          description: data.description || '',
          image: data.image_uri || '',
          creator: data.creator || '',
          createdTimestamp: data.created_timestamp || 0,
          complete: data.complete || false,
          marketCap: data.market_cap || 0,
          usdMarketCap: data.usd_market_cap || 0,
          virtualSolReserves: data.virtual_sol_reserves || 0,
          virtualTokenReserves: data.virtual_token_reserves || 0,
          totalSupply: data.total_supply || 0,
          website: data.website,
          twitter: data.twitter,
          telegram: data.telegram,
          bondingProgress,
        }
      }
      return null
    } catch {
      // Not a PumpFun token or API error - silently return null
      return null
    }
  }

  /**
   * Parse GMGN data into unified format
   */
  private parseGmgnData(data: GmgnTokenData): ParsedGmgnData {
    const riskFactors: string[] = []
    let riskScore = 0

    // Calculate risk factors
    if (!data.security?.is_mint_renounced) {
      riskFactors.push('Mint authority not renounced')
      riskScore += 20
    }
    if (!data.security?.is_freeze_renounced) {
      riskFactors.push('Freeze authority not renounced')
      riskScore += 15
    }
    if (data.security?.top_10_holder_rate > 0.7) {
      riskFactors.push('High holder concentration (>70%)')
      riskScore += 25
    } else if (data.security?.top_10_holder_rate > 0.5) {
      riskFactors.push('Moderate holder concentration (>50%)')
      riskScore += 10
    }
    if (data.creator?.creator_percentage && parseFloat(data.creator.creator_percentage) > 10) {
      riskFactors.push('Dev holds >10%')
      riskScore += 15
    }
    if (data.rugged_tokens?.length > 0) {
      riskFactors.push(`Dev has ${data.rugged_tokens.length} previous rugged tokens`)
      riskScore += 30
    }
    if (data.security?.is_honeypot) {
      riskFactors.push('Honeypot detected')
      riskScore += 40
    }
    if (data.liquidity < 10000) {
      riskFactors.push('Low liquidity (<$10K)')
      riskScore += 15
    }
    if (data.twitter_name_change_history?.length > 2) {
      riskFactors.push('Multiple Twitter name changes')
      riskScore += 10
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (riskScore >= 70) riskLevel = 'critical'
    else if (riskScore >= 50) riskLevel = 'high'
    else if (riskScore >= 30) riskLevel = 'medium'

    // Calculate buy pressure
    const buyVolume = data.trading_stats?.buy_volume_24h || 0
    const sellVolume = data.trading_stats?.sell_volume_24h || 0
    const buyPressure = sellVolume > 0 ? buyVolume / sellVolume : buyVolume > 0 ? 2 : 1

    // Determine dev status
    let devStatus: 'holding' | 'sold' | 'buying' | 'unknown' = 'unknown'
    if (data.creator?.creator_token_status) {
      const status = data.creator.creator_token_status.toLowerCase()
      if (status === 'hold' || status === 'holding') devStatus = 'holding'
      else if (status === 'sell' || status === 'sold') devStatus = 'sold'
      else if (status === 'buy' || status === 'buying') devStatus = 'buying'
    }

    return {
      riskLevel,
      riskScore,
      riskFactors,
      mintRenounced: data.security?.is_mint_renounced ?? false,
      freezeRenounced: data.security?.is_freeze_renounced ?? false,
      lpBurned: data.security?.burn_status === 'burned',
      lpBurnPercentage: parseFloat(data.security?.burn_ratio || '0') * 100,
      top10HoldersPercentage: (data.security?.top_10_holder_rate || 0) * 100,
      holderCount: data.holder_count || 0,
      smartWalletHolders: 0, // Would need additional API call
      insiderHolders: 0,
      devWallet: data.creator?.creator_address || '',
      devHoldingPercentage: parseFloat(data.creator?.creator_percentage || '0'),
      devSoldAll: data.creator?.creator_close || false,
      devStatus,
      devRugHistory: data.rugged_tokens || [],
      buyPressure,
      netFlow24h: data.trading_stats?.net_in_volume_24h || 0,
      volume24h: data.trading_stats?.volume_24h || 0,
      volumeChange: 0,
      price: data.price || 0,
      marketCap: data.market_cap || 0,
      liquidity: data.liquidity || 0,
      liquidityRatio: data.liquidity > 0 && data.market_cap > 0 ? data.liquidity / data.market_cap : 0,
      launchpad: data.launchpad || '',
      bondingComplete: data.launchpad_status === 1,
      bondingProgress: data.launchpad_progress || 0,
      dexscreenerPaid: data.dexscr_ad > 0,
      twitterNameChanges: data.twitter_name_change_history?.length || 0,
      ctoCommunityTakeover: data.cto_flag > 0,
      hotLevel: data.hot_level || 0,
      createdAt: data.creation_timestamp || 0,
      ageInHours: data.creation_timestamp 
        ? (Date.now() - data.creation_timestamp) / (1000 * 60 * 60)
        : 0,
    }
  }

  /**
   * Fetch token data from DexScreener API
   */
  private async fetchDexScreenerData(tokenMint: string): Promise<DexScreenerPair | null> {
    try {
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`,
        { timeout: 10000 }
      )

      if (response.data?.pairs && response.data.pairs.length > 0) {
        // Get the pair with highest liquidity
        const pairs = response.data.pairs as DexScreenerPair[]
        const bestPair = pairs.reduce((best, current) =>
          (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0) ? current : best
        )
        return bestPair
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Fetch on-chain data from Solana RPC
   * Supports both Token Program and Token-2022 Program
   */
  private async fetchSolanaRpcData(tokenMint: string): Promise<{
    mintAuthority: string | null
    freezeAuthority: string | null
    decimals: number
    totalSupply: number
    topHolders: TokenHolder[]
    top10Percentage: number
  } | null> {
    try {
      const mintPublicKey = new PublicKey(tokenMint)

      // Detect token program by checking account owner
      let mintInfo: any
      try {
        mintInfo = await getMint(this.connection, mintPublicKey, undefined, TOKEN_PROGRAM_ID)
      } catch {
        // If standard Token Program fails, try Token-2022
        try {
          mintInfo = await getMint(this.connection, mintPublicKey, undefined, TOKEN_2022_PROGRAM_ID)
        } catch {
          // Neither program works, try getParsedAccountInfo as last resort
          const parsedInfo = await this.connection.getParsedAccountInfo(mintPublicKey)
          const parsed = (parsedInfo?.value?.data as any)?.parsed?.info
          if (parsed) {
            mintInfo = {
              decimals: parsed.decimals ?? 0,
              supply: BigInt(parsed.supply ?? '0'),
              mintAuthority: parsed.mintAuthority ? new PublicKey(parsed.mintAuthority) : null,
              freezeAuthority: parsed.freezeAuthority ? new PublicKey(parsed.freezeAuthority) : null,
              isInitialized: parsed.isInitialized ?? true,
            }
          } else {
            return null
          }
        }
      }
      
      // Get largest token accounts (top holders)
      const largestAccounts = await this.connection.getTokenLargestAccounts(mintPublicKey)
      
      const totalSupply = Number(mintInfo.supply)
      
      // Map to holders
      const topHolders: TokenHolder[] = largestAccounts.value
        .filter(account => account.uiAmount !== null && account.uiAmount > 0)
        .slice(0, 20)
        .map(account => ({
          address: account.address.toBase58(),
          balance: account.uiAmount || 0,
          percentage: totalSupply > 0 ? (Number(account.amount) / totalSupply) * 100 : 0,
          isDevWallet: false,
          isLpPair: false,
        }))

      // Calculate top 10 percentage
      const top10Percentage = topHolders
        .slice(0, 10)
        .reduce((sum, h) => sum + h.percentage, 0)

      return {
        mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
        freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
        decimals: mintInfo.decimals,
        totalSupply: totalSupply / Math.pow(10, mintInfo.decimals),
        topHolders,
        top10Percentage,
      }
    } catch {
      return null
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA MERGERS
  // ═══════════════════════════════════════════════════════════════════════════

  private mergeBirdeyeData(result: TokenAnalysisResult, data: {
    priceUsd: number
    marketCap: number
    liquidity: number
    volume24h: number
    priceChange24h: number
  }): TokenAnalysisResult {
    return {
      ...result,
      priceUsd: data.priceUsd > 0 ? data.priceUsd : result.priceUsd,
      marketCap: data.marketCap > 0 ? data.marketCap : result.marketCap,
      liquidity: data.liquidity > 0 ? data.liquidity : result.liquidity,
      volume24h: data.volume24h > 0 ? data.volume24h : result.volume24h,
      priceChange24h: data.priceChange24h !== 0 ? data.priceChange24h : result.priceChange24h,
    }
  }

  private mergeHeliusData(result: TokenAnalysisResult, data: ParsedHeliusData): TokenAnalysisResult {
    return {
      ...result,
      name: data.name || result.name,
      symbol: data.symbol || result.symbol,
      description: data.description || result.description,
      image: data.image || result.image,
      decimals: data.decimals || result.decimals,
      totalSupply: data.totalSupply > 0 ? data.totalSupply / Math.pow(10, data.decimals) : result.totalSupply,
      mintAuthority: data.mintAuthority,
      mintAuthorityRevoked: data.mintAuthority === null,
      freezeAuthority: data.freezeAuthority,
      freezeAuthorityRevoked: data.freezeAuthority === null,
      updateAuthority: data.updateAuthority,
      isMutable: data.isMutable,
      creatorAddress: data.creators?.[0]?.address || result.creatorAddress,
      priceUsd: data.priceUsd || result.priceUsd,
      website: data.website || result.website,
      twitter: data.twitter || result.twitter,
      telegram: data.telegram || result.telegram,
      discord: data.discord || result.discord,
    }
  }

  private mergeRpcData(result: TokenAnalysisResult, data: {
    mintAuthority: string | null
    freezeAuthority: string | null
    decimals: number
    totalSupply: number
    topHolders: TokenHolder[]
    top10Percentage: number
  }): TokenAnalysisResult {
    // RPC data is authoritative for on-chain state
    return {
      ...result,
      mintAuthority: data.mintAuthority,
      mintAuthorityRevoked: data.mintAuthority === null,
      freezeAuthority: data.freezeAuthority,
      freezeAuthorityRevoked: data.freezeAuthority === null,
      decimals: data.decimals,
      totalSupply: data.totalSupply,
      topHolders: data.topHolders.length > 0 ? data.topHolders : result.topHolders,
      top10HoldersPercentage: data.top10Percentage > 0 ? data.top10Percentage : result.top10HoldersPercentage,
    }
  }

  private mergeMoralisData(result: TokenAnalysisResult, data: {
    metadata: MoralisTokenMetadata | null
    price: MoralisTokenPrice | null
    pairs: MoralisTokenPair[]
    holders: number
  }): TokenAnalysisResult {
    // Get best pair by liquidity
    const bestPair = data.pairs.length > 0
      ? data.pairs.reduce((best, current) =>
          (current.liquidityUsd || 0) > (best.liquidityUsd || 0) ? current : best
        )
      : null

    // Calculate total liquidity from all pairs
    const totalLiquidity = data.pairs.reduce((sum, pair) => sum + (pair.liquidityUsd || 0), 0)

    return {
      ...result,
      name: result.name || data.metadata?.name || '',
      symbol: result.symbol || data.metadata?.symbol || '',
      decimals: data.metadata?.decimals || result.decimals,
      image: result.image || data.metadata?.logo,
      priceUsd: data.price?.usdPrice || result.priceUsd,
      priceChange24h: data.price?.percentChange24h || result.priceChange24h,
      liquidity: totalLiquidity > 0 ? totalLiquidity : result.liquidity,
      totalHolders: data.holders > 0 ? data.holders : result.totalHolders,
      poolAddress: bestPair?.pairAddress || result.poolAddress,
      poolType: bestPair?.exchangeName || result.poolType,
      isMutable: data.metadata?.metaplex?.isMutable ?? result.isMutable,
    }
  }

  private mergeDexScreenerData(result: TokenAnalysisResult, data: DexScreenerPair): TokenAnalysisResult {
    const socials = data.info?.socials || []
    const websites = data.info?.websites || []

    // Check if LP is burned based on boost status and other indicators
    const lpBurned = result.lpBurned || (data.boosts?.active || 0) > 0

    return {
      ...result,
      name: result.name || data.baseToken.name,
      symbol: result.symbol || data.baseToken.symbol,
      image: result.image || data.info?.imageUrl,
      priceUsd: parseFloat(data.priceUsd) || result.priceUsd,
      priceSol: parseFloat(data.priceNative) || result.priceSol,
      marketCap: data.marketCap || result.marketCap,
      fullyDilutedMarketCap: data.fdv || result.fullyDilutedMarketCap,
      // Only override liquidity if DexScreener actually has a value (not undefined/null/0)
      liquidity: (data.liquidity?.usd && data.liquidity.usd > 0) ? data.liquidity.usd : result.liquidity,
      volume24h: data.volume?.h24 || result.volume24h,
      priceChange24h: data.priceChange?.h24 || result.priceChange24h,
      priceChange1h: data.priceChange?.h1 || result.priceChange1h,
      poolAddress: data.pairAddress || result.poolAddress,
      poolType: data.dexId || result.poolType,
      website: websites[0]?.url || result.website,
      twitter: socials.find(s => s.type === 'twitter')?.url || result.twitter,
      telegram: socials.find(s => s.type === 'telegram')?.url || result.telegram,
      discord: socials.find(s => s.type === 'discord')?.url || result.discord,
      dexscreenerPaid: (data.boosts?.active || 0) > 0,
      lpBurned,
    }
  }

  private mergeGmgnData(result: TokenAnalysisResult, data: ParsedGmgnData): TokenAnalysisResult {
    return {
      ...result,
      priceUsd: data.price > 0 ? data.price : result.priceUsd,
      marketCap: data.marketCap > 0 ? data.marketCap : result.marketCap,
      liquidity: data.liquidity > 0 ? data.liquidity : result.liquidity,
      volume24h: data.volume24h > 0 ? data.volume24h : result.volume24h,
      totalHolders: data.holderCount > 0 ? data.holderCount : result.totalHolders,
      top10HoldersPercentage: data.top10HoldersPercentage > 0 ? data.top10HoldersPercentage : result.top10HoldersPercentage,
      devWallet: data.devWallet || result.devWallet,
      devHoldingPercentage: data.devHoldingPercentage > 0 ? data.devHoldingPercentage : result.devHoldingPercentage,
      devStatus: data.devStatus !== 'unknown' ? (data.devStatus as 'holding' | 'sold' | 'buying') : result.devStatus,
      devRugHistory: data.devRugHistory.length > 0 ? data.devRugHistory : result.devRugHistory,
      mintAuthorityRevoked: data.mintRenounced || result.mintAuthorityRevoked,
      freezeAuthorityRevoked: data.freezeRenounced || result.freezeAuthorityRevoked,
      lpBurned: data.lpBurned || result.lpBurned,
      lpBurnedPercentage: data.lpBurnPercentage > 0 ? data.lpBurnPercentage : result.lpBurnedPercentage,
      buyPressure: data.buyPressure,
      netFlow24h: data.netFlow24h,
      launchpad: data.launchpad || result.launchpad,
      pumpfunComplete: data.bondingComplete,
      pumpfunProgress: data.bondingProgress,
      dexscreenerPaid: data.dexscreenerPaid || result.dexscreenerPaid,
      hotLevel: data.hotLevel,
      launchTimestamp: data.createdAt > 0 ? data.createdAt : result.launchTimestamp,
      riskFactors: [...result.riskFactors, ...data.riskFactors.filter(f => !result.riskFactors.includes(f))],
      smartWalletHolders: data.smartWalletHolders,
    }
  }

  private mergeRugCheckData(result: TokenAnalysisResult, data: {
    mintAuthorityRevoked: boolean
    freezeAuthorityRevoked: boolean
    riskScore: number
    risks: string[]
    lpLocked: boolean
    lpLockedPercentage: number
    totalHolders: number
    topHolders: TokenHolder[]
    top10HoldersPercentage: number
    totalLiquidityUsd: number
  }): TokenAnalysisResult {
    // RugCheck provides additional verification of security flags
    const newRiskFactors = [...result.riskFactors]
    
    // Add any new risks from RugCheck
    for (const risk of data.risks) {
      if (!newRiskFactors.includes(risk)) {
        newRiskFactors.push(risk)
      }
    }

    return {
      ...result,
      // RugCheck is authoritative for authority status
      mintAuthorityRevoked: data.mintAuthorityRevoked,
      freezeAuthorityRevoked: data.freezeAuthorityRevoked,
      riskFactors: newRiskFactors,
      // Blend RugCheck score with our calculated score
      riskScore: Math.round((result.riskScore + data.riskScore) / 2),
      // LP info from RugCheck markets data
      lpBurned: data.lpLocked || result.lpBurned,
      lpBurnedPercentage: data.lpLockedPercentage > 0 ? data.lpLockedPercentage : result.lpBurnedPercentage,
      // Liquidity from RugCheck if not already set
      liquidity: result.liquidity > 0 ? result.liquidity : data.totalLiquidityUsd,
      // Holders data from RugCheck - note: RugCheck only returns top 20, not real total
      // Only use RugCheck holder count if we have no other data at all
      totalHolders: result.totalHolders > 0 ? result.totalHolders : (data.totalHolders > 0 ? data.totalHolders : result.totalHolders),
      topHolders: (!result.topHolders || result.topHolders.length === 0) && data.topHolders.length > 0
        ? data.topHolders
        : result.topHolders,
      top10HoldersPercentage: data.top10HoldersPercentage > 0 && result.top10HoldersPercentage === 0
        ? data.top10HoldersPercentage
        : result.top10HoldersPercentage,
    }
  }

  private mergePumpFunData(result: TokenAnalysisResult, data: {
    name: string
    symbol: string
    description: string
    image: string
    creator: string
    createdTimestamp: number
    complete: boolean
    marketCap: number
    usdMarketCap: number
    virtualSolReserves: number
    virtualTokenReserves: number
    totalSupply: number
    website?: string
    twitter?: string
    telegram?: string
    bondingProgress: number
  }): TokenAnalysisResult {
    // Convert timestamp - PumpFun uses seconds, we need milliseconds
    const launchTimestamp = data.createdTimestamp > 0 
      ? (data.createdTimestamp > 1e12 ? data.createdTimestamp : data.createdTimestamp * 1000)
      : result.launchTimestamp

    // Calculate real liquidity for bonding curve tokens from virtual SOL reserves
    // Virtual SOL reserves represent the actual SOL in the bonding curve pool
    let pumpLiquidity = result.liquidity
    if (!data.complete && data.virtualSolReserves > 0) {
      // Convert lamports to SOL, then to USD using market cap ratio
      const virtualSolInSol = data.virtualSolReserves / 1e9
      // Estimate SOL price from market cap and token supply
      if (data.usdMarketCap > 0 && data.marketCap > 0) {
        const solPriceEstimate = data.usdMarketCap / data.marketCap
        pumpLiquidity = virtualSolInSol * solPriceEstimate
      }
    }

    return {
      ...result,
      name: result.name || data.name,
      symbol: result.symbol || data.symbol,
      description: data.description || result.description,
      image: data.image || result.image,
      // PumpFun tokens always have 6 decimals
      decimals: result.decimals || 6,
      devWallet: data.creator || result.devWallet,
      creatorAddress: data.creator || result.creatorAddress,
      launchTimestamp,
      launchTime: launchTimestamp ? new Date(launchTimestamp) : result.launchTime,
      pumpfunComplete: data.complete,
      pumpfunProgress: data.bondingProgress,
      marketCap: data.usdMarketCap > 0 ? data.usdMarketCap : result.marketCap,
      // Use PumpFun liquidity if better than what we have (bonding curve tokens)
      liquidity: pumpLiquidity > result.liquidity ? pumpLiquidity : result.liquidity,
      totalSupply: data.totalSupply > 0 ? data.totalSupply / 1e6 : result.totalSupply,
      website: data.website || result.website,
      twitter: data.twitter || result.twitter,
      telegram: data.telegram || result.telegram,
      launchpad: 'pumpfun',
      // Don't override poolType if already set by DexScreener (more accurate for graduated tokens)
      poolType: result.poolType || (data.complete ? 'raydium' : 'pumpfun'),
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RISK CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate comprehensive risk assessment based on all collected data
   */
  private calculateRiskAssessment(result: TokenAnalysisResult): TokenAnalysisResult {
    let riskScore = 0
    const riskFactors: string[] = [...result.riskFactors]

    // Mint authority (critical)
    if (!result.mintAuthorityRevoked) {
      if (!riskFactors.includes('Mint authority not renounced')) {
        riskFactors.push('Mint authority not renounced')
      }
      riskScore += 25
    }

    // Freeze authority (high risk)
    if (!result.freezeAuthorityRevoked) {
      if (!riskFactors.includes('Freeze authority not renounced')) {
        riskFactors.push('Freeze authority not renounced')
      }
      riskScore += 15
    }

    // Mutable metadata
    if (result.isMutable === true) {
      if (!riskFactors.includes('Metadata is mutable')) {
        riskFactors.push('Metadata is mutable')
      }
      riskScore += 5
    }

    // Top 10 holder concentration
    if (result.top10HoldersPercentage > 70) {
      if (!riskFactors.includes('High holder concentration (>70%)')) {
        riskFactors.push(`Top 10 holders own ${result.top10HoldersPercentage.toFixed(1)}%`)
      }
      riskScore += 25
    } else if (result.top10HoldersPercentage > 50) {
      if (!riskFactors.includes('Moderate holder concentration (>50%)')) {
        riskFactors.push(`Top 10 holders own ${result.top10HoldersPercentage.toFixed(1)}%`)
      }
      riskScore += 10
    }

    // Dev holding
    if (result.devHoldingPercentage && result.devHoldingPercentage > 10) {
      if (!riskFactors.includes('Dev holds >10%')) {
        riskFactors.push(`Dev holds ${result.devHoldingPercentage.toFixed(1)}%`)
      }
      riskScore += 15
    } else if (result.devHoldingPercentage && result.devHoldingPercentage > 5) {
      riskScore += 5
    }

    // Low liquidity
    if (result.liquidity < 10000) {
      if (!riskFactors.includes('Low liquidity (<$10K)')) {
        riskFactors.push(`Low liquidity: $${result.liquidity.toFixed(0)}`)
      }
      riskScore += 15
    }

    // LP not burned
    if (!result.lpBurned) {
      if (!riskFactors.includes('LP not burned')) {
        riskFactors.push('LP not burned')
      }
      riskScore += 10
    }

    // New token (< 1 hour)
    if (result.ageInHours !== undefined && result.ageInHours < 1) {
      if (!riskFactors.includes('Very new token (<1h)')) {
        riskFactors.push('Very new token (<1h)')
      }
      riskScore += 10
    }

    // Few holders
    if (result.totalHolders < 100) {
      if (!riskFactors.includes('Few holders (<100)')) {
        riskFactors.push(`Only ${result.totalHolders} holders`)
      }
      riskScore += 10
    }

    // Dev rug history
    if (result.devRugHistory && result.devRugHistory.length > 0) {
      riskScore += 30
    }

    // Honeypot
    if (result.isHoneypot) {
      riskFactors.push('Honeypot detected!')
      riskScore += 50
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (riskScore >= 70) riskLevel = 'critical'
    else if (riskScore >= 50) riskLevel = 'high'
    else if (riskScore >= 30) riskLevel = 'medium'

    return {
      ...result,
      riskLevel,
      riskScore: Math.min(100, riskScore),
      riskFactors: [...new Set(riskFactors)], // Remove duplicates
    }
  }

  /**
   * Generate trading signals based on analysis
   */
  public generateSignals(result: TokenAnalysisResult): GmgnSignal[] {
    const signals: GmgnSignal[] = []
    const now = Date.now()

    // New listing signal
    if (result.ageInHours !== undefined && result.ageInHours < 1) {
      signals.push({
        type: 'new_listing',
        strength: 'strong',
        message: `New token launched ${Math.round(result.ageInHours * 60)}m ago`,
        timestamp: now,
      })
    }

    // Buy pressure signal
    if (result.buyPressure !== undefined && result.buyPressure > 1.5) {
      signals.push({
        type: 'high_buy_pressure',
        strength: result.buyPressure > 2 ? 'strong' : 'moderate',
        message: `Buy/Sell ratio: ${result.buyPressure.toFixed(2)}x`,
        timestamp: now,
      })
    } else if (result.buyPressure !== undefined && result.buyPressure < 0.5) {
      signals.push({
        type: 'high_sell_pressure',
        strength: result.buyPressure < 0.3 ? 'strong' : 'moderate',
        message: `Sell pressure: ${(1 / result.buyPressure).toFixed(2)}x more sells`,
        timestamp: now,
      })
    }

    // Bonding complete signal
    if (result.pumpfunComplete) {
      signals.push({
        type: 'bonding_complete',
        strength: 'moderate',
        message: 'PumpFun bonding curve complete',
        timestamp: now,
      })
    }

    // Dev selling signal
    if (result.devStatus === 'sold') {
      signals.push({
        type: 'dev_selling',
        strength: 'strong',
        message: 'Developer has sold their tokens',
        timestamp: now,
      })
    }

    // Rug warning
    if (result.riskLevel === 'critical' || (result.devRugHistory && result.devRugHistory.length > 0)) {
      signals.push({
        type: 'rug_warning',
        strength: 'strong',
        message: result.devRugHistory?.length 
          ? `Dev has ${result.devRugHistory.length} previous rugged tokens`
          : 'Critical risk level detected',
        timestamp: now,
      })
    }

    // Honeypot warning
    if (result.isHoneypot) {
      signals.push({
        type: 'honeypot_detected',
        strength: 'strong',
        message: 'Honeypot detected - cannot sell!',
        timestamp: now,
      })
    }

    return signals
  }

  /**
   * Clear cache for a specific token or all tokens
   */
  public clearCache(tokenMint?: string): void {
    if (tokenMint) {
      this.cache.delete(tokenMint)
    } else {
      this.cache.clear()
    }
  }
}

// Export singleton instance
export const tokenAnalysisService = new TokenAnalysisService()
