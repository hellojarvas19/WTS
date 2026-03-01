import axios from 'axios'
import { Connection, PublicKey } from '@solana/web3.js'
// @ts-expect-error
import { getAccount, getMint, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { Metadata, deprecated } from '@metaplex-foundation/mpl-token-metadata'
import { RpcConnectionManager } from '../providers/solana'

/**
 * Comprehensive Token Metadata Interface
 */
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
  poolType?: string // 'raydium' | 'pumpfun' | 'orca' | 'meteora'
  lpBurned?: boolean
  lpBurnedPercentage?: number
  
  // Supply Info
  totalSupply?: number
  circulatingSupply?: number
  
  // Holders Info
  totalHolders?: number
  top10HoldersPercentage?: number
  topHolders?: HolderInfo[]
  
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
  pumpfunComplete?: boolean // Bonding curve complete
  
  // Risk Indicators
  isRugPull?: boolean
  isHoneypot?: boolean
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  
  // Source tracking
  dataSource?: string[]
}

export interface HolderInfo {
  address: string
  balance: number
  percentage: number
  isDevWallet?: boolean
  isLpPair?: boolean
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

/**
 * Moralis Token Metadata Response
 */
export interface MoralisTokenMetadata {
  mint: string
  standard: string
  name: string
  symbol: string
  decimals: number
  logo?: string
  thumbnail?: string
  metaplex?: {
    metadataUri?: string
    updateAuthority?: string
    sellerFeeBasisPoints?: number
    primarySaleHappened?: boolean
    isMutable?: boolean
    masterEdition?: boolean
  }
}

/**
 * Moralis Token Price Response  
 */
export interface MoralisTokenPrice {
  usdPrice: number
  usdPriceFormatted?: string
  nativePrice?: {
    value: string
    symbol: string
    name: string
    decimals: number
  }
  percentChange24h?: number
  exchangeName?: string
  exchangeAddress?: string
  tokenAddress?: string
}

/**
 * Moralis SPL Token Holder/Balance Response
 */
export interface MoralisSPLTokenBalance {
  associatedTokenAddress: string
  mint: string
  amountRaw: string
  amount: string
  decimals: number
  name?: string
  symbol?: string
}

/**
 * Moralis Token Pairs/Swaps Response
 */
export interface MoralisTokenPair {
  exchangeAddress: string
  exchangeName: string
  exchangeLogo?: string
  pairAddress: string
  pairLabel: string
  usdPrice: number
  usdPriceFormatted?: string
  liquidityUsd?: number
  baseToken: string
  quoteToken: string
}

/**
 * Combined Moralis Data Response
 */
export interface MoralisFullData {
  metadata: MoralisTokenMetadata | null
  price: MoralisTokenPrice | null
  pairs: MoralisTokenPair[]
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

/**
 * Comprehensive Token Metadata Service
 * Aggregates data from multiple sources: Moralis, PumpFun, DexScreener, Birdeye, and on-chain
 */
export class TokenMetadataService {
  private connection: Connection

  constructor(connection?: Connection) {
    this.connection = connection || RpcConnectionManager.getRandomConnection()
  }

  /**
   * Fetch comprehensive token metadata from all available sources
   */
  public async getTokenMetadata(tokenMint: string): Promise<TokenMetadata> {
    const sources: string[] = []
    
    // Initialize with basic data
    let metadata: TokenMetadata = {
      name: '',
      symbol: '',
      mint: tokenMint,
      decimals: 0,
      dataSource: [],
    }

    // Fetch from all sources in parallel
    const [
      onChainData,
      dexScreenerData,
      moralisData,
      pumpFunData,
      birdeyeData,
      holdersData,
    ] = await Promise.allSettled([
      this.fetchOnChainMetadata(tokenMint),
      this.fetchDexScreenerData(tokenMint),
      this.fetchMoralisData(tokenMint),
      this.fetchPumpFunData(tokenMint),
      this.fetchBirdeyeData(tokenMint),
      this.fetchTopHoldersFromRpc(tokenMint),
    ])

    // Merge on-chain data (highest priority for security info)
    if (onChainData.status === 'fulfilled' && onChainData.value) {
      metadata = { ...metadata, ...onChainData.value }
      sources.push('onchain')
    }

    // Merge DexScreener data (good for market data)
    if (dexScreenerData.status === 'fulfilled' && dexScreenerData.value) {
      metadata = this.mergeDexScreenerData(metadata, dexScreenerData.value)
      sources.push('dexscreener')
    }

    // Merge Moralis data (token metadata, price, and pairs)
    if (moralisData.status === 'fulfilled' && moralisData.value) {
      metadata = this.mergeMoralisData(metadata, moralisData.value)
      sources.push('moralis')
    }

    // Merge PumpFun data (if it's a PumpFun token)
    if (pumpFunData.status === 'fulfilled' && pumpFunData.value) {
      metadata = this.mergePumpFunData(metadata, pumpFunData.value)
      sources.push('pumpfun')
    }

    // Merge Birdeye data
    if (birdeyeData.status === 'fulfilled' && birdeyeData.value) {
      metadata = this.mergeBirdeyeData(metadata, birdeyeData.value)
      sources.push('birdeye')
    }

    // Merge holders data from RPC
    if (holdersData.status === 'fulfilled' && holdersData.value) {
      metadata.topHolders = holdersData.value.holders
      metadata.top10HoldersPercentage = holdersData.value.top10Percentage
      if (!metadata.totalHolders) {
        metadata.totalHolders = holdersData.value.holders.length
      }
      sources.push('rpc-holders')
    }

    // Calculate age if launch time is available
    if (metadata.launchTimestamp) {
      metadata.ageInHours = (Date.now() - metadata.launchTimestamp) / (1000 * 60 * 60)
    }

    // Calculate risk level
    metadata.riskLevel = this.calculateRiskLevel(metadata)
    metadata.dataSource = sources

    return metadata
  }

  /**
   * Fetch on-chain metadata from Metaplex and SPL Token
   */
  private async fetchOnChainMetadata(tokenMint: string): Promise<Partial<TokenMetadata> | null> {
    try {
      const mintPublicKey = new PublicKey(tokenMint)
      
      // Fetch mint info for authorities - supports both Token Program and Token-2022
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
      
      // Fetch Metaplex metadata
      let metaplexData: any = null
      try {
        const tokenmetaPubkey = await deprecated.Metadata.getPDA(mintPublicKey)
        const tokenContent = await Metadata.fromAccountAddress(this.connection, tokenmetaPubkey)
        metaplexData = tokenContent.pretty()
      } catch {
        // Metaplex metadata might not exist for all tokens (e.g., Token-2022 with embedded metadata)
      }

      // For Token-2022 tokens, try to get name/symbol from getParsedAccountInfo if Metaplex fails
      let tokenName = metaplexData?.data?.name?.replace(/\x00/g, '') || ''
      let tokenSymbol = metaplexData?.data?.symbol?.replace(/\x00/g, '') || ''
      
      if (!tokenName || !tokenSymbol) {
        try {
          const parsedInfo = await this.connection.getParsedAccountInfo(mintPublicKey)
          const extensions = (parsedInfo?.value?.data as any)?.parsed?.info?.extensions
          if (extensions) {
            const tokenMetaExt = extensions.find((ext: any) => ext.extension === 'tokenMetadata')
            if (tokenMetaExt?.state) {
              tokenName = tokenName || tokenMetaExt.state.name || ''
              tokenSymbol = tokenSymbol || tokenMetaExt.state.symbol || ''
            }
          }
        } catch {
          // Silently handle
        }
      }

      return {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: mintInfo.decimals,
        totalSupply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
        mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
        mintAuthorityRevoked: mintInfo.mintAuthority === null,
        freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
        freezeAuthorityRevoked: mintInfo.freezeAuthority === null,
        isMutable: metaplexData?.isMutable ?? true,
        creatorAddress: metaplexData?.data?.creators?.[0]?.address || metaplexData?.updateAuthority,
      }
    } catch (error: any) {
      // Silently handle common errors (invalid account owner, non-token accounts)
      const errorName = error?.name || error?.constructor?.name || ''
      if (errorName.includes('TokenInvalidAccountOwner') || errorName.includes('TokenAccountNotFound')) {
        // This is expected for some token addresses - don't log
        return null
      }
      // Only log unexpected errors with brief message
      console.log('On-chain metadata fetch failed:', errorName || 'unknown error')
      return null
    }
  }

  /**
   * Fetch data from DexScreener API
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
    } catch (error: any) {
      // Silently handle - DexScreener may not have data for all tokens
      if (error?.response?.status !== 404) {
        console.log('DexScreener fetch failed:', error?.response?.status || error?.code || 'timeout')
      }
      return null
    }
  }

  /**
   * Fetch data from Moralis API
   * Combines token metadata, price, and pairs data
   */
  private async fetchMoralisData(tokenMint: string): Promise<MoralisFullData | null> {
    const apiKey = process.env.MORALIS_API_KEY
    if (!apiKey) {
      return null
    }

    const headers = {
      'Accept': 'application/json',
      'X-API-Key': apiKey,
    }

    try {
      // Fetch metadata, price, and pairs in parallel
      const [metadataRes, priceRes, pairsRes] = await Promise.allSettled([
        axios.get(
          `https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/metadata`,
          { timeout: 10000, headers }
        ),
        axios.get(
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

      if (!metadata && !price && pairs.length === 0) {
        return null
      }

      return { metadata, price, pairs }
    } catch {
      // Silently handle errors
      return null
    }
  }

  /**
   * Fetch top token holders using Solana RPC
   * Uses getTokenLargestAccounts to get top 20 holders
   */
  private async fetchTopHoldersFromRpc(tokenMint: string): Promise<{
    holders: HolderInfo[]
    top10Percentage: number
  } | null> {
    try {
      const mintPublicKey = new PublicKey(tokenMint)
      
      // Get largest token accounts (top 20 holders)
      const largestAccounts = await this.connection.getTokenLargestAccounts(mintPublicKey)
      
      if (!largestAccounts.value || largestAccounts.value.length === 0) {
        return null
      }

      // Get total supply for percentage calculation - supports Token-2022
      let mintInfo: any
      try {
        mintInfo = await getMint(this.connection, mintPublicKey, undefined, TOKEN_PROGRAM_ID)
      } catch {
        try {
          mintInfo = await getMint(this.connection, mintPublicKey, undefined, TOKEN_2022_PROGRAM_ID)
        } catch {
          const parsedInfo = await this.connection.getParsedAccountInfo(mintPublicKey)
          const parsed = (parsedInfo?.value?.data as any)?.parsed?.info
          if (parsed) {
            mintInfo = { supply: BigInt(parsed.supply ?? '0') }
          } else {
            return null
          }
        }
      }
      const totalSupply = Number(mintInfo.supply)
      
      if (totalSupply === 0) {
        return null
      }

      // Map to HolderInfo
      const holders: HolderInfo[] = largestAccounts.value
        .filter(account => account.uiAmount !== null && account.uiAmount > 0)
        .slice(0, 20)
        .map(account => ({
          address: account.address.toBase58(),
          balance: account.uiAmount || 0,
          percentage: (Number(account.amount) / totalSupply) * 100,
          isDevWallet: false,
          isLpPair: false,
        }))

      // Calculate top 10 percentage
      const top10Percentage = holders
        .slice(0, 10)
        .reduce((sum, h) => sum + h.percentage, 0)

      return {
        holders,
        top10Percentage,
      }
    } catch {
      // Silently handle errors
      return null
    }
  }

  /**
   * Fetch data from PumpFun API
   */
  private async fetchPumpFunData(tokenMint: string): Promise<PumpFunTokenData | null> {
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
        return response.data as PumpFunTokenData
      }
      return null
    } catch {
      // Not a PumpFun token or API error - silently return null
      return null
    }
  }

  /**
   * Fetch data from Birdeye API
   */
  private async fetchBirdeyeData(tokenMint: string): Promise<BirdeyeTokenData | null> {
    // Skip if no API key configured
    if (!process.env.BIRDEYE_API_KEY) {
      return null
    }

    try {
      const response = await axios.get(
        `https://public-api.birdeye.so/defi/token_overview?address=${tokenMint}`,
        {
          timeout: 10000,
          headers: {
            'X-API-KEY': process.env.BIRDEYE_API_KEY,
            'x-chain': 'solana',
          },
        }
      )
      
      if (response.data?.success && response.data?.data) {
        return response.data.data as BirdeyeTokenData
      }
      return null
    } catch {
      // Silently handle errors - Birdeye API may have rate limits or require API key
      return null
    }
  }

  /**
   * Merge DexScreener data into metadata
   */
  private mergeDexScreenerData(metadata: TokenMetadata, data: DexScreenerPair): TokenMetadata {
    const socials = data.info?.socials || []
    const websites = data.info?.websites || []

    return {
      ...metadata,
      name: metadata.name || data.baseToken.name,
      symbol: metadata.symbol || data.baseToken.symbol,
      image: metadata.image || data.info?.imageUrl,
      priceUsd: parseFloat(data.priceUsd) || metadata.priceUsd,
      priceSol: parseFloat(data.priceNative) || metadata.priceSol,
      marketCap: data.marketCap || metadata.marketCap,
      fullyDilutedMarketCap: data.fdv || metadata.fullyDilutedMarketCap,
      liquidity: data.liquidity?.usd || metadata.liquidity,
      volume24h: data.volume?.h24 || metadata.volume24h,
      priceChange24h: data.priceChange?.h24 || metadata.priceChange24h,
      priceChange1h: data.priceChange?.h1 || metadata.priceChange1h,
      poolAddress: data.pairAddress || metadata.poolAddress,
      poolType: data.dexId || metadata.poolType,
      website: websites[0]?.url || metadata.website,
      twitter: socials.find(s => s.type === 'twitter')?.url || metadata.twitter,
      telegram: socials.find(s => s.type === 'telegram')?.url || metadata.telegram,
      discord: socials.find(s => s.type === 'discord')?.url || metadata.discord,
      dexscreenerPaid: (data.boosts?.active || 0) > 0,
    }
  }

  /**
   * Merge Moralis data into metadata
   */
  private mergeMoralisData(
    metadata: TokenMetadata,
    data: MoralisFullData
  ): TokenMetadata {
    const tokenMeta = data.metadata
    const tokenPrice = data.price
    const pairs = data.pairs || []

    // Get best pair by liquidity
    const bestPair = pairs.length > 0
      ? pairs.reduce((best, current) => 
          (current.liquidityUsd || 0) > (best.liquidityUsd || 0) ? current : best
        )
      : null

    // Calculate total liquidity from all pairs
    const totalLiquidity = pairs.reduce((sum, pair) => sum + (pair.liquidityUsd || 0), 0)

    return {
      ...metadata,
      // Basic token info
      name: metadata.name || tokenMeta?.name || '',
      symbol: metadata.symbol || tokenMeta?.symbol || '',
      decimals: tokenMeta?.decimals || metadata.decimals,
      image: metadata.image || tokenMeta?.logo || tokenMeta?.thumbnail,
      
      // Price data
      priceUsd: tokenPrice?.usdPrice || metadata.priceUsd,
      priceChange24h: tokenPrice?.percentChange24h || metadata.priceChange24h,
      
      // Liquidity from pairs
      liquidity: totalLiquidity > 0 ? totalLiquidity : metadata.liquidity,
      
      // Pool info from best pair
      poolAddress: bestPair?.pairAddress || metadata.poolAddress,
      poolType: bestPair?.exchangeName || metadata.poolType,
      
      // Moralis metaplex data for security
      isMutable: tokenMeta?.metaplex?.isMutable ?? metadata.isMutable,
      creatorAddress: tokenMeta?.metaplex?.updateAuthority || metadata.creatorAddress,
    }
  }

  /**
   * Merge PumpFun data into metadata
   */
  private mergePumpFunData(metadata: TokenMetadata, data: PumpFunTokenData): TokenMetadata {
    // Convert timestamp - PumpFun may return seconds or milliseconds
    const rawTimestamp = data.created_timestamp || 0
    const launchTimestamp = rawTimestamp > 0
      ? (rawTimestamp > 1e12 ? rawTimestamp : rawTimestamp * 1000)
      : metadata.launchTimestamp

    return {
      ...metadata,
      name: metadata.name || data.name,
      symbol: metadata.symbol || data.symbol,
      description: data.description || metadata.description,
      image: data.image_uri || metadata.image,
      marketCap: data.usd_market_cap || metadata.marketCap,
      devWallet: data.creator || metadata.devWallet,
      creatorAddress: data.creator || metadata.creatorAddress,
      launchTimestamp,
      launchTime: launchTimestamp ? new Date(launchTimestamp) : metadata.launchTime,
      website: data.website || metadata.website,
      twitter: data.twitter || metadata.twitter,
      telegram: data.telegram || metadata.telegram,
      pumpfunComplete: data.complete,
      pumpfunKingOfTheHill: !!data.king_of_the_hill_timestamp,
      poolType: data.complete ? (metadata.poolType || 'pumpfun') : 'pumpfun',
      totalSupply: data.total_supply ? data.total_supply / 1e6 : metadata.totalSupply,
    }
  }

  /**
   * Merge Birdeye data into metadata
   */
  private mergeBirdeyeData(metadata: TokenMetadata, data: BirdeyeTokenData): TokenMetadata {
    return {
      ...metadata,
      name: metadata.name || data.name,
      symbol: metadata.symbol || data.symbol,
      decimals: data.decimals || metadata.decimals,
      priceUsd: data.price || metadata.priceUsd,
      marketCap: data.mc || metadata.marketCap,
      liquidity: data.liquidity || metadata.liquidity,
      volume24h: data.v24hUSD || metadata.volume24h,
      priceChange24h: data.priceChange24hPercent || metadata.priceChange24h,
      totalHolders: data.holder || metadata.totalHolders,
    }
  }

  /**
   * Calculate risk level based on various factors
   * Note: undefined values are treated as unknown (potentially risky) for security
   */
  private calculateRiskLevel(metadata: TokenMetadata): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0

    // Mint authority not revoked (treat undefined as risky - we don't know if it's safe)
    if (metadata.mintAuthorityRevoked === false) riskScore += 30
    else if (metadata.mintAuthorityRevoked === undefined) riskScore += 15 // Unknown = moderate risk

    // Freeze authority not revoked
    if (metadata.freezeAuthorityRevoked === false) riskScore += 20
    else if (metadata.freezeAuthorityRevoked === undefined) riskScore += 10 // Unknown = moderate risk

    // Mutable metadata (default to true/risky if undefined)
    if (metadata.isMutable === true || metadata.isMutable === undefined) riskScore += 10

    // High top 10 holder concentration (>50%)
    const top10 = metadata.top10HoldersPercentage
    if (top10 !== undefined) {
      if (top10 > 70) riskScore += 30
      else if (top10 > 50) riskScore += 15
    }

    // Dev holds significant amount (>5%)
    const devHolding = metadata.devWalletHoldingPercentage
    if (devHolding !== undefined) {
      if (devHolding > 10) riskScore += 20
      else if (devHolding > 5) riskScore += 10
    }

    // Low liquidity (<$10k)
    const liquidity = metadata.liquidity
    if (liquidity !== undefined && liquidity < 10000) riskScore += 15

    // Very new token (<1 hour)
    const age = metadata.ageInHours
    if (age !== undefined && age < 1) riskScore += 10

    // LP not burned (treat undefined as not burned for safety)
    if (metadata.lpBurned !== true) riskScore += 10

    // Few holders (<100)
    const holders = metadata.totalHolders
    if (holders !== undefined && holders < 100) riskScore += 10

    if (riskScore >= 70) return 'critical'
    if (riskScore >= 50) return 'high'
    if (riskScore >= 30) return 'medium'
    return 'low'
  }

  /**
   * Format metadata for display in Telegram message
   */
  public formatForTelegram(metadata: TokenMetadata): string {
    const formatNumber = (num: number | undefined): string => {
      if (num === undefined) return 'N/A'
      if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
      if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
      if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
      return `$${num.toFixed(2)}`
    }

    const formatPercentage = (num: number | undefined): string => {
      if (num === undefined) return 'N/A'
      return `${num.toFixed(2)}%`
    }

    const boolIcon = (val: boolean | undefined): string => {
      if (val === undefined) return '❓'
      return val ? '✅' : '❌'
    }

    const riskEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    }

    const lines: string[] = [
      `<b>🪙 ${metadata.name || 'Unknown'} (${metadata.symbol || 'N/A'})</b>`,
      ``,
      `<b>💰 Market Data:</b>`,
      `├ Price: ${metadata.priceUsd ? `$${metadata.priceUsd.toFixed(8)}` : 'N/A'}`,
      `├ Market Cap: ${formatNumber(metadata.marketCap)}`,
      `├ Liquidity: ${formatNumber(metadata.liquidity)}`,
      `├ 24h Volume: ${formatNumber(metadata.volume24h)}`,
      `└ 24h Change: ${formatPercentage(metadata.priceChange24h)}`,
      ``,
      `<b>👥 Holders:</b>`,
      `├ Total: ${metadata.totalHolders?.toLocaleString() || 'N/A'}`,
      `├ Top 10: ${formatPercentage(metadata.top10HoldersPercentage)}`,
      `└ Dev Holds: ${formatPercentage(metadata.devWalletHoldingPercentage)}`,
      ``,
      `<b>🔒 Security:</b>`,
      `├ Mint Revoked: ${boolIcon(metadata.mintAuthorityRevoked)}`,
      `├ Freeze Revoked: ${boolIcon(metadata.freezeAuthorityRevoked)}`,
      `├ LP Burned: ${boolIcon(metadata.lpBurned)}${metadata.lpBurnedPercentage ? ` (${metadata.lpBurnedPercentage.toFixed(1)}%)` : ''}`,
      `├ Mutable: ${boolIcon(!metadata.isMutable)} ${metadata.isMutable ? '(Mutable)' : '(Immutable)'}`,
      `└ Risk: ${riskEmoji[metadata.riskLevel || 'medium']} ${(metadata.riskLevel || 'unknown').toUpperCase()}`,
      ``,
      `<b>📊 Info:</b>`,
      `├ Pool: ${metadata.poolType || 'N/A'}`,
      `├ Age: ${metadata.ageInHours ? `${metadata.ageInHours.toFixed(1)}h` : 'N/A'}`,
      `├ DEX Paid: ${boolIcon(metadata.dexscreenerPaid)}`,
    ]

    // Add PumpFun specific info
    if (metadata.pumpfunComplete !== undefined) {
      lines.push(`├ Bonding: ${metadata.pumpfunComplete ? '✅ Complete' : '⏳ Active'}`)
    }
    if (metadata.pumpfunKingOfTheHill) {
      lines.push(`├ 👑 King of the Hill`)
    }

    // Add social links
    const socials: string[] = []
    if (metadata.website) socials.push(`<a href="${metadata.website}">Web</a>`)
    if (metadata.twitter) socials.push(`<a href="${metadata.twitter}">X</a>`)
    if (metadata.telegram) socials.push(`<a href="${metadata.telegram}">TG</a>`)
    if (metadata.discord) socials.push(`<a href="${metadata.discord}">DC</a>`)
    
    if (socials.length > 0) {
      lines.push(`└ Links: ${socials.join(' • ')}`)
    }

    // Add dev wallet
    if (metadata.devWallet) {
      const shortDev = `${metadata.devWallet.slice(0, 4)}...${metadata.devWallet.slice(-4)}`
      lines.push(``)
      lines.push(`<b>👨‍💻 Dev:</b> <code>${shortDev}</code>`)
    }

    // Add mint address
    lines.push(``)
    lines.push(`<code>${metadata.mint}</code>`)

    return lines.join('\n')
  }

  /**
   * Get quick summary for transaction notifications
   */
  public getQuickSummary(metadata: TokenMetadata): string {
    const formatNumber = (num: number | undefined): string => {
      if (num === undefined) return '?'
      if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
      if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
      return num.toFixed(0)
    }

    const parts: string[] = []
    
    if (metadata.marketCap) parts.push(`MC: $${formatNumber(metadata.marketCap)}`)
    if (metadata.liquidity) parts.push(`Liq: $${formatNumber(metadata.liquidity)}`)
    if (metadata.totalHolders) parts.push(`Holders: ${formatNumber(metadata.totalHolders)}`)
    
    // Security flags
    const flags: string[] = []
    if (metadata.mintAuthorityRevoked) flags.push('✅MR')
    else flags.push('❌MR')
    if (metadata.lpBurned) flags.push('🔥LP')
    
    if (flags.length > 0) parts.push(flags.join(' '))

    return parts.join(' | ')
  }
}

// Export singleton instance
export const tokenMetadataService = new TokenMetadataService()
