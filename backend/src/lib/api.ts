import axios from 'axios'
import { PumpDetail } from '../types/gmgn-ai-types'
import { TokenInfoPump } from '../types/pumpfun-types'
import { HeliusTransaction } from '../types/helius-types'

// Re-export the new token analysis service and types
export { TokenAnalysisService, tokenAnalysisService, type TokenAnalysisResult, type TokenHolder } from './token-analysis'

/**
 * Moralis Token Metadata Response
 */
interface MoralisTokenData {
  mint: string
  name: string
  symbol: string
  decimals: number
  metaplex?: {
    metadataUri?: string
    updateAuthority?: string
    isMutable?: boolean
  }
}

// this class is no longer used in this project but some of these apis can be useful
export class ApiRequests {
  constructor() {}

  /**
   * Fetch token info from Moralis API
   * Replaces GMGN which was blocked by Cloudflare
   */
  public async moralisTokenInfo(addr: string): Promise<MoralisTokenData | undefined> {
    const apiKey = process.env.MORALIS_API_KEY
    if (!apiKey) {
      return
    }

    try {
      const res = await fetch(`https://solana-gateway.moralis.io/token/mainnet/${addr}/metadata`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': apiKey,
        }
      })
      
      if (!res.ok) {
        return
      }

      const data = await res.json()
      return data as MoralisTokenData
    } catch {
      // Silently handle errors
      return
    }
  }

  /**
   * @deprecated Use moralisTokenInfo instead - GMGN API is blocked by Cloudflare
   */
  public async gmgnTokenInfo(addr: string): Promise<PumpDetail | undefined> {
    // GMGN API is blocked by Cloudflare - redirect to Moralis
    console.log('GMGN API is deprecated, use Moralis API instead')
    return undefined
  }

  public async pumpFunTokenInfo(addr: string): Promise<TokenInfoPump | undefined> {
    try {
      const url = `https://frontend-api-v3.pump.fun/coins/${addr}`
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://www.pump.fun/',
          Origin: 'https://www.pump.fun',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        },
      })
      if (response.status === 200) {
        return response.data
      }
      return
    } catch {
      // Silently handle - not a PumpFun token or API error
      return
    }
  }

  static async parseTransactionWithHelius(
    transactionSignature: string,
  ): Promise<{ message: string; type: 'buy' | 'sell' } | undefined> {
    const apiUrl = `https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}`
    console.log('Parsing Transaction:', transactionSignature)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: [transactionSignature],
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const transactions = (await response.json()) as HeliusTransaction[]
      console.log('Received transactions:', transactions)
      
      // Validate response structure before accessing
      if (!transactions || transactions.length === 0) {
        console.error('No transactions returned from Helius API')
        return undefined
      }
      
      const firstTx = transactions[0]
      if (!firstTx || !firstTx.accountData || firstTx.accountData.length === 0) {
        console.error('Invalid transaction structure from Helius API')
        return undefined
      }
      
      const firstAccountData = firstTx.accountData[0]
      if (!firstAccountData) {
        console.error('Missing account data in first transaction')
        return undefined
      }
      
      const type: 'buy' | 'sell' = firstAccountData.nativeBalanceChange > 0 ? 'sell' : 'buy'

      return {
        message: firstTx.description,
        type,
      }
    } catch (error) {
      console.error('Error parsing transaction with Helius:', error)
      return undefined
    }
  }
}
