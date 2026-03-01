import { Connection, PublicKey, AccountInfo } from '@solana/web3.js'
import { ParsedTxInfo } from '../types/general-interfaces'
import { PUMP_FUN_PROGRAM_ID } from '../config/program-ids'
import { PumpMarketCurve } from './pump-market-curve'

// SPL Token Program IDs for validation
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

export class TokenMarketPrice {
  constructor(private connection: Connection) {
    this.connection = connection
  }

  /**
   * Calculate token price for PumpFun AMM (PumpSwap) transactions
   * Uses pool balances to determine price.
   * 
   * Strategy: Try each pair of instruction addresses as potential pool accounts.
   * PumpSwap transfers have SPL token + Wrapped SOL accounts that represent the pool.
   * We scan all instruction addresses and find a valid (tokenAccount, wsolAccount) pair.
   */
  public async getTokenPricePumpFunAMM(
    txInstructions: ParsedTxInfo[],
    type: 'buy' | 'sell',
    solPriceInUsd: number,
  ): Promise<number | undefined> {
    if (!txInstructions || txInstructions.length === 0) {
      // Not an error - some transactions have no instructions to price from
      return undefined
    }

    try {
      // Collect all unique addresses from instructions to try as pool accounts
      const candidateAddresses: string[] = []
      for (const inst of txInstructions) {
        if (inst?.info?.source) candidateAddresses.push(inst.info.source)
        if (inst?.info?.destination) candidateAddresses.push(inst.info.destination)
      }

      // Deduplicate
      const uniqueAddresses = [...new Set(candidateAddresses)]

      // Try the standard 2-instruction approach first (fastest path)
      if (txInstructions.length >= 2 && txInstructions[0] && txInstructions[1]) {
        const price = await this.tryCalculatePoolPrice(txInstructions, type, solPriceInUsd)
        if (price !== undefined) return price
      }

      // Fallback: scan all address pairs to find valid pool accounts
      // Look for one SPL token account and one Wrapped SOL account
      let splTokenBalance: number | null = null
      let wrappedSolBalance: number | null = null

      for (const addr of uniqueAddresses) {
        try {
          const pubkey = new PublicKey(addr)
          const balance = await this.getSafeTokenBalance(pubkey)
          if (balance === null) continue

          if (balance > 0) {
            const mint = await this.getTokenAccountMint(pubkey)
            if (mint === 'So11111111111111111111111111111111111111112') {
              wrappedSolBalance = balance
            } else if (mint && splTokenBalance === null) {
              splTokenBalance = balance
            }
          }
        } catch {
          // Skip invalid addresses
        }

        if (splTokenBalance !== null && wrappedSolBalance !== null) break
      }

      if (splTokenBalance !== null && wrappedSolBalance !== null && splTokenBalance > 0) {
        const priceOfSPLTokenInSOL = (wrappedSolBalance / 1_000_000_000) / (splTokenBalance / 1_000_000)
        if (isFinite(priceOfSPLTokenInSOL) && !isNaN(priceOfSPLTokenInSOL)) {
          return this.formatTokenPrice(priceOfSPLTokenInSOL * solPriceInUsd)
        }
      }

      return undefined
    } catch {
      // Silently handle - price will be fetched from analysis service as fallback
      return undefined
    }
  }

  /**
   * Try the standard 2-instruction pool price calculation
   */
  private async tryCalculatePoolPrice(
    txInstructions: ParsedTxInfo[],
    type: 'buy' | 'sell',
    solPriceInUsd: number,
  ): Promise<number | undefined> {
    try {
      let tokenAddr: string
      let wsolAddr: string

      if (type === 'buy') {
        tokenAddr = txInstructions[0].info.source
        wsolAddr = txInstructions[1].info.destination
      } else {
        tokenAddr = txInstructions[0].info.destination
        wsolAddr = txInstructions[1].info.source
      }

      if (!tokenAddr || !wsolAddr) return undefined

      const splTokenBalance = await this.getSafeTokenBalance(new PublicKey(tokenAddr))
      const wrappedSolBalance = await this.getSafeTokenBalance(new PublicKey(wsolAddr))

      if (splTokenBalance === null || wrappedSolBalance === null || splTokenBalance === 0) {
        return undefined
      }

      const priceOfSPLTokenInSOL = (wrappedSolBalance / 1_000_000_000) / (splTokenBalance / 1_000_000)
      if (!isFinite(priceOfSPLTokenInSOL) || isNaN(priceOfSPLTokenInSOL)) {
        return undefined
      }

      return this.formatTokenPrice(priceOfSPLTokenInSOL * solPriceInUsd)
    } catch {
      return undefined
    }
  }

  /**
   * Calculate token price for Raydium transactions
   * Uses pool balances to determine price.
   * Falls back to scanning instruction addresses if standard layout fails.
   */
  public async getTokenPriceRaydium(
    txInstructions: ParsedTxInfo[],
    type: 'buy' | 'sell',
    solPriceInUsd: number,
  ): Promise<number | undefined> {
    if (!txInstructions || txInstructions.length === 0) {
      return undefined
    }

    try {
      // Standard Raydium layout: instruction[0] = SOL side, instruction[1] = token side
      if (txInstructions.length >= 2 && txInstructions[0] && txInstructions[1]) {
        let tokenAddr: string
        let wsolAddr: string

        if (type === 'buy') {
          tokenAddr = txInstructions[1].info.source
          wsolAddr = txInstructions[0].info.destination
        } else {
          tokenAddr = txInstructions[0].info.destination
          wsolAddr = txInstructions[1].info.source
        }

        if (tokenAddr && wsolAddr) {
          const splTokenBalance = await this.getSafeTokenBalance(new PublicKey(tokenAddr))
          const wrappedSolBalance = await this.getSafeTokenBalance(new PublicKey(wsolAddr))

          if (splTokenBalance !== null && wrappedSolBalance !== null && splTokenBalance > 0) {
            const priceOfSPLTokenInSOL = (wrappedSolBalance / 1_000_000_000) / (splTokenBalance / 1_000_000)
            if (isFinite(priceOfSPLTokenInSOL) && !isNaN(priceOfSPLTokenInSOL)) {
              return this.formatTokenPrice(priceOfSPLTokenInSOL * solPriceInUsd)
            }
          }
        }

        // Try reversed layout (some DEXes swap instruction order)
        if (tokenAddr && wsolAddr) {
          const splTokenBalance = await this.getSafeTokenBalance(new PublicKey(wsolAddr))
          const wrappedSolBalance = await this.getSafeTokenBalance(new PublicKey(tokenAddr))

          if (splTokenBalance !== null && wrappedSolBalance !== null && splTokenBalance > 0) {
            const priceOfSPLTokenInSOL = (wrappedSolBalance / 1_000_000_000) / (splTokenBalance / 1_000_000)
            if (isFinite(priceOfSPLTokenInSOL) && !isNaN(priceOfSPLTokenInSOL)) {
              return this.formatTokenPrice(priceOfSPLTokenInSOL * solPriceInUsd)
            }
          }
        }
      }

      // Fallback: scan all addresses from all instructions to find pool accounts
      const candidateAddresses: string[] = []
      for (const inst of txInstructions) {
        if (inst?.info?.source) candidateAddresses.push(inst.info.source)
        if (inst?.info?.destination) candidateAddresses.push(inst.info.destination)
      }

      const uniqueAddresses = [...new Set(candidateAddresses)]
      let splTokenBalance: number | null = null
      let wrappedSolBalance: number | null = null

      for (const addr of uniqueAddresses) {
        try {
          const pubkey = new PublicKey(addr)
          const balance = await this.getSafeTokenBalance(pubkey)
          if (balance === null || balance === 0) continue

          const mint = await this.getTokenAccountMint(pubkey)

          if (mint === 'So11111111111111111111111111111111111111112') {
            wrappedSolBalance = balance
          } else if (splTokenBalance === null) {
            splTokenBalance = balance
          }
        } catch {
          // Skip invalid addresses
        }

        if (splTokenBalance !== null && wrappedSolBalance !== null) break
      }

      if (splTokenBalance !== null && wrappedSolBalance !== null && splTokenBalance > 0) {
        const priceOfSPLTokenInSOL = (wrappedSolBalance / 1_000_000_000) / (splTokenBalance / 1_000_000)
        if (isFinite(priceOfSPLTokenInSOL) && !isNaN(priceOfSPLTokenInSOL)) {
          return this.formatTokenPrice(priceOfSPLTokenInSOL * solPriceInUsd)
        }
      }

      return undefined
    } catch {
      // Silently handle - price will be fetched from analysis service as fallback
      return undefined
    }
  }

  public async getTokenPricePumpFun(tokenAddress: string, solPrice: string | undefined): Promise<number | null> {
    const pumpFunProgram = new PublicKey(PUMP_FUN_PROGRAM_ID)
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), new PublicKey(tokenAddress).toBytes()],
      pumpFunProgram,
    )

    const curveAddressStr = bondingCurve.toBase58()

    if (!curveAddressStr) return null

    const curveAddress = new PublicKey(curveAddressStr)

    const curveState = await PumpMarketCurve.getPumpCurveState(this.connection, curveAddress)
    if (!curveState) return null

    const tokenPriceSol = PumpMarketCurve.calculatePumpCurvePrice(curveState)

    // treat this as raydium token
    if (tokenPriceSol === 0) return null

    const parsedSolPrice = Number(solPrice)
    const validSolPrice = isNaN(parsedSolPrice) ? 0 : parsedSolPrice

    const tokenPriceUsd = tokenPriceSol * validSolPrice

    // const formattedPrice = FormatNumbers.formatTokenPrice(tokenPriceUsd)

    return tokenPriceUsd
  }

  public async getTokenMktCap(tokenPrice: number, tokenMint: string, isPump: boolean) {
    try {
      let supplyValue = null
      let supplyAmount = null

      const mintPublicKey = new PublicKey(tokenMint)

      if (isPump) {
        supplyValue = 1e9
        supplyAmount = 1e9
      } else {
        const tokenSupply = await this.connection.getTokenSupply(mintPublicKey)
        supplyValue = tokenSupply.value.uiAmount
        supplyAmount = Number(tokenSupply.value.amount)
      }

      if (!supplyValue) {
        return { tokenMarketCap: 0, supplyAmount: 0 }
      }

      const tokenMarketCap = Number(supplyValue) * tokenPrice

      // console.log('TOKEN_MARKET_CAP', tokenMarketCap)
      return { tokenMarketCap, supplyAmount: supplyAmount || 0 }
    } catch (error) {
      console.log('GET_TOKEN_MKC_ERROR')
      return { tokenMarketCap: 0, supplyAmount: 0 }
    }
  }

  /**
   * Get token balance with validation that the account is a valid token account
   * Supports both standard Token Program and Token-2022 Program
   * Returns null if the account is not a token account or balance cannot be fetched
   */
  public async getSafeTokenBalance(tokenAccountAddress: PublicKey): Promise<number | null> {
    try {
      // First check if the account exists and is owned by a token program
      const accountInfo = await this.connection.getAccountInfo(tokenAccountAddress)
      
      if (!accountInfo) {
        return null
      }
      
      // Check if the account is owned by a token program
      const ownerProgram = accountInfo.owner.toBase58()
      if (ownerProgram !== TOKEN_PROGRAM_ID && ownerProgram !== TOKEN_2022_PROGRAM_ID) {
        return null
      }
      
      // Use getTokenAccountBalance - works for both Token and Token-2022 programs
      const tokenBalance = await this.connection.getTokenAccountBalance(tokenAccountAddress)
      return Number(tokenBalance.value.amount)
    } catch (error: any) {
      // Silently handle expected errors
      const msg = error?.message || ''
      if (msg.includes('not a Token account') || msg.includes('Invalid param') || msg.includes('could not find account')) {
        return null
      }
      // Try getParsedAccountInfo as last resort
      try {
        const parsed = await this.connection.getParsedAccountInfo(tokenAccountAddress)
        const amount = (parsed?.value?.data as any)?.parsed?.info?.tokenAmount?.amount
        if (amount) return Number(amount)
      } catch {
        // Final fallback failed
      }
      return null
    }
  }

  /**
   * Get the mint address of a token account
   * Works for both Token Program and Token-2022 Program accounts
   */
  private async getTokenAccountMint(tokenAccountAddress: PublicKey): Promise<string | null> {
    try {
      const parsed = await this.connection.getParsedAccountInfo(tokenAccountAddress)
      const mint = (parsed?.value?.data as any)?.parsed?.info?.mint
      return mint || null
    } catch {
      return null
    }
  }

  /**
   * Legacy method - kept for backward compatibility but prefer getSafeTokenBalance
   */
  public async getTokenBalance(tokenAccountAddress: PublicKey): Promise<string | undefined> {
    try {
      const tokenBalance = await this.connection.getTokenAccountBalance(tokenAccountAddress)
      return tokenBalance.value.amount
    } catch (error: any) {
      // Only log if it's not the expected "not a Token account" error
      if (!error?.message?.includes('not a Token account')) {
        console.log('Error fetching token balance:', error)
      }
      return undefined
    }
  }

  /**
   * Format token price to handle scientific notation
   */
  private formatTokenPrice(price: number): number {
    if (price.toString().includes('e')) {
      const formattedPrice = price.toFixed(10)
      const [integerPart, decimalPart] = formattedPrice.split('.')
      const newDecimalPart = decimalPart!.replace(/^0{3}/, '')
      return parseFloat(`${integerPart}.${newDecimalPart}`)
    }
    return price
  }
}
