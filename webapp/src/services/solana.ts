// ═══════════════════════════════════════════════════════════════════════════════
// SOLANA SERVICE - Token Metadata & Transaction Fetching
// ═══════════════════════════════════════════════════════════════════════════════

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import axios from 'axios'
import type { 
  TokenMetadata, 
  DexScreenerPair, 
  PumpFunTokenData,
  Transaction 
} from '@/types/solana'

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class ConnectionManager {
  private static connections: Connection[] = []

  static initialize(rpcUrls?: string[]) {
    if (rpcUrls && rpcUrls.length > 0) {
      this.connections = rpcUrls.map(url => new Connection(url, 'confirmed'))
    } else {
      this.connections = [new Connection(clusterApiUrl('mainnet-beta'), 'confirmed')]
    }
  }

  static getConnection(): Connection {
    if (this.connections.length === 0) {
      this.initialize()
    }
    return this.connections[0]
  }

  static getRandomConnection(): Connection {
    if (this.connections.length === 0) {
      this.initialize()
    }
    const randomIndex = Math.floor(Math.random() * this.connections.length)
    return this.connections[randomIndex]
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN METADATA SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class TokenMetadataService {

  async getTokenMetadata(tokenMint: string): Promise<TokenMetadata> {
    const sources: string[] = []
    
    let metadata: TokenMetadata = {
      name: '',
      symbol: '',
      mint: tokenMint,
      decimals: 0,
    }

    // Fetch from all sources in parallel
    const [
      dexScreenerData,
      pumpFunData,
    ] = await Promise.allSettled([
      this.fetchDexScreenerData(tokenMint),
      this.fetchPumpFunData(tokenMint),
    ])

    // Merge DexScreener data
    if (dexScreenerData.status === 'fulfilled' && dexScreenerData.value) {
      metadata = this.mergeDexScreenerData(metadata, dexScreenerData.value)
      sources.push('dexscreener')
    }

    // Merge PumpFun data
    if (pumpFunData.status === 'fulfilled' && pumpFunData.value) {
      metadata = this.mergePumpFunData(metadata, pumpFunData.value)
      sources.push('pumpfun')
    }

    // Calculate risk level
    metadata.riskLevel = this.calculateRiskLevel(metadata)

    return metadata
  }

  private async fetchDexScreenerData(tokenMint: string): Promise<DexScreenerPair | null> {
    try {
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`,
        { timeout: 10000 }
      )
      
      if (response.data?.pairs && response.data.pairs.length > 0) {
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
      return null
    }
  }

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

  private mergePumpFunData(metadata: TokenMetadata, data: PumpFunTokenData): TokenMetadata {
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

  private calculateRiskLevel(metadata: TokenMetadata): TokenMetadata['riskLevel'] {
    let riskScore = 0

    if (metadata.mintAuthorityRevoked === false) riskScore += 30
    else if (metadata.mintAuthorityRevoked === undefined) riskScore += 15

    if (metadata.freezeAuthorityRevoked === false) riskScore += 20
    else if (metadata.freezeAuthorityRevoked === undefined) riskScore += 10

    if (metadata.isMutable === true || metadata.isMutable === undefined) riskScore += 10

    const top10 = metadata.top10HoldersPercentage
    if (top10 !== undefined) {
      if (top10 > 70) riskScore += 30
      else if (top10 > 50) riskScore += 15
    }

    const devHolding = metadata.devWalletHoldingPercentage
    if (devHolding !== undefined) {
      if (devHolding > 10) riskScore += 20
      else if (devHolding > 5) riskScore += 10
    }

    const liquidity = metadata.liquidity
    if (liquidity !== undefined && liquidity < 10000) riskScore += 15

    const age = metadata.ageInHours
    if (age !== undefined && age < 1) riskScore += 10

    if (metadata.lpBurned !== true) riskScore += 10

    const holders = metadata.totalHolders
    if (holders !== undefined && holders < 100) riskScore += 10

    if (riskScore >= 70) return 'critical'
    if (riskScore >= 50) return 'high'
    if (riskScore >= 30) return 'medium'
    return 'low'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class TransactionService {
  private connection: Connection

  constructor(connection?: Connection) {
    this.connection = connection || ConnectionManager.getConnection()
  }

  async fetchRecentTransactions(walletAddress: string, limit: number = 10): Promise<Transaction[]> {
    try {
      const publicKey = new PublicKey(walletAddress)
      
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit }
      )

      const transactions: Transaction[] = []

      for (const sigInfo of signatures) {
        const tx = await this.connection.getParsedTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        })

        if (!tx) continue

        const parsedTx = this.parseTransaction(tx, sigInfo.signature, walletAddress)
        transactions.push(parsedTx)
      }

      return transactions
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
  }

  private parseTransaction(tx: any, signature: string, walletAddress: string): Transaction {
    const meta = tx.meta
    const transaction = tx.transaction
    const message = transaction.message
    
    // Get timestamp
    const timestamp = tx.blockTime ? tx.blockTime * 1000 : Date.now()
    
    // Determine transaction type and platform
    let type: Transaction['type'] = 'unknown'
    let platform: Transaction['platform'] = 'unknown'
    let description = ''
    
    // Parse instructions to determine platform
    const instructions = message.instructions || []
    
    // Check for DEX platforms
    const programIds = instructions.map((ix: any) => 
      ix.programId?.toString?.() || ix.programId
    )
    
    // Raydium program IDs
    if (programIds.some((id: string) => 
      id?.includes('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8') ||
      id?.includes('RVKd61ztZW9GUwhRbbLoYVRE5Xf1B2tVscKqwZqXgEr')
    )) {
      platform = 'raydium'
    }
    // Jupiter
    else if (programIds.some((id: string) => 
      id?.includes('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4')
    )) {
      platform = 'jupiter'
    }
    // PumpFun
    else if (programIds.some((id: string) => 
      id?.includes('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')
    )) {
      platform = 'pumpfun'
    }
    
    // Parse token transfers
    const tokenIn: Transaction['tokenIn'] = {
      mint: '',
      symbol: 'SOL',
      amount: '0',
      decimals: 9,
    }
    const tokenOut: Transaction['tokenOut'] = {
      mint: '',
      symbol: 'SOL',
      amount: '0',
      decimals: 9,
    }
    
    // Parse pre and post token balances
    const preBalances = meta?.preTokenBalances || []
    const postBalances = meta?.postTokenBalances || []
    
    // Calculate SOL change
    const preSolBalance = meta?.preBalances?.[0] || 0
    const postSolBalance = meta?.postBalances?.[0] || 0
    const solChange = (postSolBalance - preSolBalance) / 1e9
    
    // Determine if buy or sell based on SOL flow
    if (Math.abs(solChange) > 0.001) {
      if (solChange < 0) {
        type = 'buy'
        tokenIn.amount = Math.abs(solChange).toFixed(6)
      } else {
        type = 'sell'
        tokenOut.amount = solChange.toFixed(6)
      }
    }
    
    // Check for token transfers
    const tokenChanges: { mint: string; change: number; decimals: number }[] = []
    
    for (const post of postBalances) {
      const pre = preBalances.find((p: any) => 
        p.accountIndex === post.accountIndex && p.mint === post.mint
      )
      
      const preAmount = pre ? parseFloat(pre.uiTokenAmount?.uiAmountString || '0') : 0
      const postAmount = parseFloat(post.uiTokenAmount?.uiAmountString || '0')
      const change = postAmount - preAmount
      
      if (Math.abs(change) > 0.000001) {
        tokenChanges.push({
          mint: post.mint,
          change,
          decimals: post.uiTokenAmount?.decimals || 6,
        })
      }
    }
    
    // Assign token transfers
    if (tokenChanges.length > 0) {
      const mainChange = tokenChanges.reduce((max, curr) => 
        Math.abs(curr.change) > Math.abs(max.change) ? curr : max
      )
      
      if (type === 'buy') {
        tokenOut.mint = mainChange.mint
        tokenOut.amount = Math.abs(mainChange.change).toFixed(6)
        tokenOut.decimals = mainChange.decimals
      } else if (type === 'sell') {
        tokenIn.mint = mainChange.mint
        tokenIn.amount = Math.abs(mainChange.change).toFixed(6)
        tokenIn.decimals = mainChange.decimals
      }
    }
    
    // Create description
    if (type === 'buy') {
      description = `Bought ${tokenOut.amount} tokens for ${tokenIn.amount} SOL on ${platform}`
    } else if (type === 'sell') {
      description = `Sold ${tokenIn.amount} tokens for ${tokenOut.amount} SOL on ${platform}`
    } else {
      description = `Transaction on ${platform}`
    }
    
    return {
      signature,
      timestamp,
      type,
      platform,
      owner: walletAddress,
      description,
      tokenIn: tokenIn.mint ? tokenIn : undefined,
      tokenOut: tokenOut.mint ? tokenOut : undefined,
      solAmount: Math.abs(solChange),
      lamportsAmount: Math.abs(postSolBalance - preSolBalance),
      status: meta?.err ? 'failed' : 'confirmed',
    }
  }

  async fetchTransactionDetails(signature: string): Promise<any> {
    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      })
      return tx
    } catch (error) {
      console.error('Error fetching transaction details:', error)
      return null
    }
  }
}

// Export singleton instances
export const tokenMetadataService = new TokenMetadataService()
export const transactionService = new TransactionService()
