import { TokenUtils } from '../lib/token-utils'
import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js'
import { SwapType } from '../types/swap-types'
import { FormatNumbers } from '../lib/format-numbers'
import { NativeParserInterface, TransferParserInterface } from '../types/general-interfaces'
import { RpcConnectionManager } from '../providers/solana'
import { TokenMarketPrice } from '../markets/token-market-price'

/**
 * Normalized transfer instruction data
 * Handles both 'transfer' and 'transferChecked' instruction types
 */
interface NormalizedTransfer {
  type: 'transfer' | 'transferChecked'
  amount: string
  source: string
  destination: string
  mint?: string // Only available for transferChecked
  decimals?: number // Only available for transferChecked
}

/**
 * Normalize a transfer instruction to a common format
 */
function normalizeTransfer(parsed: any): NormalizedTransfer | null {
  if (!parsed || !parsed.info) return null
  
  if (parsed.type === 'transferChecked') {
    return {
      type: 'transferChecked',
      amount: parsed.info.tokenAmount?.amount || '0',
      source: parsed.info.source,
      destination: parsed.info.destination,
      mint: parsed.info.mint,
      decimals: parsed.info.tokenAmount?.decimals,
    }
  } else if (parsed.type === 'transfer') {
    return {
      type: 'transfer',
      amount: parsed.info.amount || '0',
      source: parsed.info.source,
      destination: parsed.info.destination,
    }
  }
  
  return null
}

export class TransactionParser {
  private tokenUtils: TokenUtils
  private tokenMarketPrice: TokenMarketPrice
  private connection: Connection
  constructor(private transactionSignature: string) {
    this.connection = RpcConnectionManager.getRandomConnection()
    this.tokenUtils = new TokenUtils(this.connection)
    this.tokenMarketPrice = new TokenMarketPrice(this.connection)
    this.transactionSignature = this.transactionSignature
  }

  public async parseDefiTransaction(
    transactionDetails: (ParsedTransactionWithMeta | null)[],
    swap: SwapType,
    solPriceUsd: string | undefined,
    walletAddress: string,
  ): Promise<NativeParserInterface | undefined> {
    try {
      if (transactionDetails === undefined) {
        console.log('Transaction not found or invalid.')
        return
      }

      let owner = ''
      let amountIn = ''
      let tokenIn = ''
      let amountOut = ''
      let tokenOut = ''

      let currentHoldingPrice = ''
      let currentHoldingPercentage = ''

      // TODO!
      let isNew = false

      const transactions: any = []

      let tokenInMint: string = ''
      let tokenOutMint: string = ''

      // let solPrice: string | undefined = ''

      // console.log('PARSED_TRANSACTION:', transactionDetails)

      const accountKeys = transactionDetails[0]?.transaction.message.accountKeys

      if (!accountKeys) {
        console.log('Account keys not found in transaction details.', transactionDetails)
        return
      }

      const signerAccount = accountKeys!.find((account) => account.signer === true)

      const signerAccountAddress = signerAccount?.pubkey.toString()

      const preBalances = transactionDetails[0]?.meta?.preBalances
      const postBalances = transactionDetails[0]?.meta?.postBalances

      // Transaction Metadata - Extract and normalize transfer instructions
      // Different DEXes use different instruction types:
      // - 'transfer': Standard SPL token transfer (PumpFun bonding, some Raydium)
      // - 'transferChecked': Includes decimal check (Jupiter, Raydium CLMM/CPMM, PumpSwap, Orca, Meteora)
      
      const innerInstructions = transactionDetails[0]?.meta?.innerInstructions || []
      const normalizedTransfers: NormalizedTransfer[] = []
      
      // Extract all transfer instructions (both types)
      for (const innerInst of innerInstructions) {
        if (!innerInst.instructions) continue
        for (const inst of innerInst.instructions) {
          // Type guard for parsed instructions
          const parsedInst = 'parsed' in inst ? inst.parsed : undefined
          if (parsedInst) {
            const normalized = normalizeTransfer(parsedInst)
            if (normalized) {
              normalizedTransfers.push(normalized)
              transactions.push(parsedInst) // Keep raw for backward compatibility
            }
          }
        }
      }
      
      // Check main transaction instructions if inner instructions yielded nothing
      if (normalizedTransfers.length === 0) {
        const mainInstructions = transactionDetails[0]?.transaction?.message?.instructions || []
        for (const inst of mainInstructions) {
          // Type guard for ParsedInstruction
          if ('parsed' in inst && inst.parsed) {
            const normalized = normalizeTransfer(inst.parsed)
            if (normalized) {
              normalizedTransfers.push(normalized)
              transactions.push(inst.parsed)
            }
          }
        }
      }
      
      // Debug logging for troubleshooting
      if (normalizedTransfers.length === 0) {
        console.log(`DEBUG: No transfers found for ${swap} swap. Signature: ${this.transactionSignature}`)
        console.log(`DEBUG: Inner instructions count: ${innerInstructions.length}`)
        // Log instruction types found for debugging
        const foundTypes: Set<string> = new Set()
        for (const innerInst of innerInstructions) {
          if (!innerInst.instructions) continue
          for (const inst of innerInst.instructions) {
            // Check for parsed instruction type
            if ('parsed' in inst && inst.parsed?.type) {
              foundTypes.add(inst.parsed.type)
            }
            // Check for program ID
            if ('programId' in inst && inst.programId) {
              foundTypes.add(`program:${inst.programId.toBase58()}`)
            }
          }
        }
        if (foundTypes.size > 0) {
          console.log(`DEBUG: Instruction types found: ${Array.from(foundTypes).join(', ')}`)
        }
      }
      
      // Use normalized transfers for cleaner access
      const transfers = normalizedTransfers

      // console.log('transaction', transactions)

      const nativeBalance = this.tokenUtils.calculateNativeBalanceChanges(transactionDetails)
      // console.log('native balance', nativeBalance)

      if (!preBalances || !postBalances) {
        console.log('No balance information available')
        return
      }

      // we have to do this for pumpfun transactions since swap info is not available in its instructions
      let totalSolSwapped = 0

      if (swap === 'pumpfun' || swap === 'mint_pumpfun') {
        if (nativeBalance?.type === 'sell') {
          for (let i = 0; i < preBalances.length; i++) {
            const preBalance = preBalances[i]
            const postBalance = postBalances[i]
            if (preBalance !== undefined && postBalance !== undefined) {
              const solDifference = (postBalance - preBalance) / 1e9
              if (solDifference < 0) {
                totalSolSwapped += Math.abs(solDifference)
              }
            }
          }
        } else if (nativeBalance?.type === 'buy') {
          // For buys, the signer (index 0) sends SOL - use their balance decrease
          if (preBalances[0] !== undefined && postBalances[0] !== undefined) {
            const signerChange = (preBalances[0] - postBalances[0]) / 1e9
            if (signerChange > 0) {
              totalSolSwapped = Math.max(0, signerChange - 0.000005) // subtract tx fee
            } else {
              // Fallback: check index 3 (traditional PumpFun account layout)
              if (preBalances[3] !== undefined && postBalances[3] !== undefined) {
                const idx3Diff = Math.abs((postBalances[3] - preBalances[3]) / 1e9)
                if (idx3Diff > 0) {
                  totalSolSwapped = idx3Diff
                } else {
                  // Last resort: check index 2
                  if (preBalances[2] !== undefined && postBalances[2] !== undefined) {
                    totalSolSwapped = Math.abs((postBalances[2] - preBalances[2]) / 1e9)
                  }
                }
              }
            }
          }
        }
      }

      if (swap === 'pumpfun_amm' && preBalances && postBalances && preBalances.length === postBalances.length) {
        if (nativeBalance?.type === 'sell') {
          // For sells, track SOL increase on the signer (index 0) minus fee
          for (let i = 0; i < preBalances.length; i++) {
            const preBalance = preBalances[i]
            const postBalance = postBalances[i]
            if (preBalance !== undefined && postBalance !== undefined) {
              const solDifference = (postBalance - preBalance) / 1e9
              if (solDifference < 0) {
                totalSolSwapped += Math.abs(solDifference)
              }
            }
          }
        } else if (nativeBalance?.type === 'buy') {
          // For buys, the signer (index 0) sends SOL - use their balance decrease
          // Subtract estimated tx fee (~0.005 SOL) for accuracy
          if (preBalances[0] !== undefined && postBalances[0] !== undefined) {
            const signerChange = (preBalances[0] - postBalances[0]) / 1e9
            if (signerChange > 0) {
              // Subtract approximate transaction fee (5000 lamports = 0.000005 SOL)
              totalSolSwapped = Math.max(0, signerChange - 0.000005)
            } else {
              // Fallback: find the largest SOL inflow to pool accounts
              for (let i = 1; i < preBalances.length; i++) {
                const preBalance = preBalances[i]
                const postBalance = postBalances[i]
                if (preBalance !== undefined && postBalance !== undefined) {
                  const solDifference = (postBalance - preBalance) / 1e9
                  if (solDifference > totalSolSwapped) {
                    totalSolSwapped = solDifference
                  }
                }
              }
            }
          }
        }
      }

      // Early exit if no transfers found
      if (transfers.length === 0) {
        console.log('NO TRANSFER INSTRUCTIONS FOUND')
        return
      }

      // Find the main transfer instruction for token info extraction
      // Different swap types have different transfer patterns
      let mainTransferIdx = 0
      let secondaryTransferIdx = transfers.length - 1
      
      if (transfers.length > 2) {
        // For complex swaps (Jupiter, multi-hop), try to find the matching transfer
        // First try: destination matches first transfer's source
        const matchIdx = transfers.findIndex((t, idx) => idx > 0 && t.destination === transfers[0]?.source)
        if (matchIdx > 0) {
          secondaryTransferIdx = matchIdx
        } else {
          // Fallback: Find transfer with different source than first
          const diffIdx = transfers.findIndex((t, idx) => idx > 0 && t.source !== transfers[0]?.source)
          if (diffIdx > 0) {
            secondaryTransferIdx = diffIdx
          }
        }
      }
      
      const firstTransfer = transfers[mainTransferIdx]
      const lastTransfer = transfers[secondaryTransferIdx]
      
      if (!firstTransfer) {
        console.log('NO VALID TRANSFER FOUND - transfers:', transfers.length)
        return
      }

      // For pumpfun_amm, we need at least 2 transfers
      if (swap === 'pumpfun_amm' && transfers.length < 2) {
        console.log('NO PUMP AMM TRANSFER - need at least 2 transfers')
        return
      }
      
      // Determine if this is a transferChecked-based swap (has mint info)
      const isTransferChecked = firstTransfer.type === 'transferChecked'

      // Handle transferChecked-based swaps (PumpSwap, Jupiter, Raydium CLMM, Orca, Meteora)
      if (swap === 'pumpfun_amm' || (isTransferChecked && firstTransfer.mint)) {
        if (nativeBalance?.type === 'sell') {
          tokenOutMint = firstTransfer.mint || await this.tokenUtils.getTokenMintAddress(firstTransfer.destination)
          tokenInMint = 'So11111111111111111111111111111111111111112'

          if (!tokenOutMint) {
            console.log('NO TOKEN OUT MINT for sell')
            return
          }

          const tokenOutInfo = await this.tokenUtils.getParsedTokenInfo(tokenOutMint)
          tokenOut = tokenOutInfo ? tokenOutInfo.data.symbol.replace(/\x00/g, '') : tokenOutMint.slice(0, 8)
          tokenIn = 'SOL'
        } else {
          tokenInMint = firstTransfer.mint || await this.tokenUtils.getTokenMintAddress(firstTransfer.source)
          tokenOutMint = 'So11111111111111111111111111111111111111112'

          if (!tokenInMint) {
            console.log('NO TOKEN IN MINT for buy')
            return
          }

          const tokenInInfo = await this.tokenUtils.getParsedTokenInfo(tokenInMint)
          tokenIn = tokenInInfo ? tokenInInfo.data.symbol.replace(/\x00/g, '') : tokenInMint.slice(0, 8)
          tokenOut = 'SOL'
        }

        const formattedAmount = FormatNumbers.formatTokenAmount(Number(firstTransfer.amount) || 0)

        amountOut = nativeBalance?.type === 'sell' ? formattedAmount : totalSolSwapped.toFixed(2).toString()
        amountIn = nativeBalance?.type === 'sell' ? totalSolSwapped.toFixed(2).toString() : formattedAmount

        owner = walletAddress

        const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

        let tokenMc: number | null | undefined = null

        // get the token price and market cap for raydium

        const tokenPrice = await this.tokenMarketPrice.getTokenPricePumpFunAMM(
          transactions,
          nativeBalance?.type as 'buy' | 'sell',
          Number(solPriceUsd),
        )

        const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

        if (tokenPrice) {
          const { tokenMarketCap, supplyAmount } = await this.tokenMarketPrice.getTokenMktCap(
            tokenPrice,
            tokenToMc,
            true,
          )
          tokenMc = tokenMarketCap

          const tokenHoldings = await this.tokenUtils.getTokenHoldings(owner, tokenToMc, supplyAmount, true)

          currentHoldingPercentage = tokenHoldings.percentage
          currentHoldingPrice = tokenHoldings.balance
        }

        return {
          platform: swap,
          owner: owner,
          description: swapDescription,
          type: nativeBalance?.type,
          balanceChange: nativeBalance?.balanceChange,
          signature: this.transactionSignature,
          swappedTokenMc: tokenMc,
          swappedTokenPrice: tokenPrice,
          solPrice: solPriceUsd || '',
          currenHoldingPercentage: currentHoldingPercentage,
          currentHoldingPrice: currentHoldingPrice,
          isNew: isNew,
          tokenTransfers: {
            tokenInSymbol: tokenIn,
            tokenInMint: tokenInMint,
            tokenAmountIn: amountIn,
            tokenOutSymbol: tokenOut,
            tokenOutMint: tokenOutMint,
            tokenAmountOut: amountOut,
          },
        }
      }

      // for raydium/jupiter transactions with regular transfers (multiple transfers)
      if (transfers.length > 1 && !isTransferChecked) {
        if (nativeBalance?.type === 'sell') {
          tokenOutMint = firstTransfer.mint || await this.tokenUtils.getTokenMintAddress(firstTransfer.destination)
          tokenInMint = 'So11111111111111111111111111111111111111112'

          if (tokenOutMint === null) {
            console.log('NO TOKEN OUT MINT')
            return
          }

          const tokenOutInfo = await this.tokenUtils.getParsedTokenInfo(tokenOutMint)
          tokenOut = tokenOutInfo ? tokenOutInfo.data.symbol.replace(/\x00/g, '') : tokenOutMint.slice(0, 8)
          tokenIn = 'SOL'
        } else {
          tokenInMint = lastTransfer.mint || await this.tokenUtils.getTokenMintAddress(lastTransfer.source)
          tokenOutMint = 'So11111111111111111111111111111111111111112'

          if (tokenInMint === null) {
            console.log('NO TOKEN IN MINT')
            return
          }

          const tokenInInfo = await this.tokenUtils.getParsedTokenInfo(tokenInMint)
          tokenIn = tokenInInfo ? tokenInInfo.data.symbol.replace(/\x00/g, '') : tokenInMint.slice(0, 8)
          tokenOut = 'SOL'
        }

        const formattedAmountOut = FormatNumbers.formatTokenAmount(Number(firstTransfer.amount))
        const formattedAmountIn = FormatNumbers.formatTokenAmount(Number(lastTransfer.amount))

        owner = walletAddress
        amountOut =
          tokenOut === 'SOL' ? (Number(firstTransfer.amount) / 1e9).toFixed(2).toString() : formattedAmountOut
        amountIn =
          tokenIn === 'SOL' ? (Number(lastTransfer.amount) / 1e9).toFixed(2).toString() : formattedAmountIn

        let tokenMc: number | null | undefined = null
        let raydiumTokenPrice: number | null | undefined = null

        const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

        // get the token price and market cap for raydium
        if (firstTransfer.amount !== transfers[1]?.amount) {
          const tokenPrice = await this.tokenMarketPrice.getTokenPriceRaydium(
            transactions,
            nativeBalance?.type as 'buy' | 'sell',
            Number(solPriceUsd),
          )

          const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

          if (tokenPrice) {
            const { tokenMarketCap, supplyAmount } = await this.tokenMarketPrice.getTokenMktCap(
              tokenPrice,
              tokenToMc,
              false,
            )
            tokenMc = tokenMarketCap
            raydiumTokenPrice = tokenPrice

            const tokenHoldings = await this.tokenUtils.getTokenHoldings(owner, tokenToMc, supplyAmount, false)

            currentHoldingPercentage = tokenHoldings.percentage
            currentHoldingPrice = tokenHoldings.balance
          }
        }

        return {
          platform: swap,
          owner: owner,
          description: swapDescription,
          type: nativeBalance?.type,
          balanceChange: nativeBalance?.balanceChange,
          signature: this.transactionSignature,
          swappedTokenMc: tokenMc,
          swappedTokenPrice: raydiumTokenPrice,
          solPrice: solPriceUsd || '',
          currenHoldingPercentage: currentHoldingPercentage,
          currentHoldingPrice: currentHoldingPrice,
          isNew: isNew,
          tokenTransfers: {
            tokenInSymbol: tokenIn,
            tokenInMint: tokenInMint,
            tokenAmountIn: amountIn,
            tokenOutSymbol: tokenOut,
            tokenOutMint: tokenOutMint,
            tokenAmountOut: amountOut,
          },
        }
      }

      // for pump fun bonding curve transactions (single transfer or same amounts)
      if (transfers.length === 1 || (transfers.length > 1 && firstTransfer.amount === transfers[1]?.amount)) {
        if (nativeBalance?.type === 'sell') {
          tokenOutMint = firstTransfer.mint || await this.tokenUtils.getTokenMintAddressWithFallback(transactions)
          tokenInMint = 'So11111111111111111111111111111111111111112'

          if (tokenOutMint === null) {
            console.log('NO TOKEN OUT MINT')
            return
          }

          const tokenOutInfo = await this.tokenUtils.getParsedTokenInfo(tokenOutMint)
          tokenOut = tokenOutInfo ? tokenOutInfo.data.symbol.replace(/\x00/g, '') : tokenOutMint.slice(0, 8)
          tokenIn = 'SOL'
        } else {
          tokenOutMint = 'So11111111111111111111111111111111111111112'
          tokenInMint = firstTransfer.mint || await this.tokenUtils.getTokenMintAddressWithFallback(transactions)

          if (tokenInMint === null) {
            console.log('NO TOKEN IN MINT')
            return
          }

          const tokenInInfo = await this.tokenUtils.getParsedTokenInfo(tokenInMint)
          tokenIn = tokenInInfo ? tokenInInfo.data.symbol.replace(/\x00/g, '') : tokenInMint.slice(0, 8)
          tokenOut = 'SOL'
        }

        const formattedAmount = FormatNumbers.formatTokenAmount(Number(firstTransfer.amount))

        // owner = signerAccountAddress ? signerAccountAddress : transactions[0]?.info?.authority
        owner = walletAddress
        amountOut = nativeBalance?.type === 'sell' ? formattedAmount : totalSolSwapped.toFixed(2).toString()
        amountIn = nativeBalance?.type === 'sell' ? totalSolSwapped.toFixed(2).toString() : formattedAmount

        // console.log('OWNER', signerAccountAddress)
        const swapDescription = `${owner} swapped ${amountOut} ${tokenOut} for ${amountIn} ${tokenIn}`

        let tokenMc: number | null | undefined = null

        // get the token price and market cap for pumpfun
        const tokenToMc = tokenInMint === 'So11111111111111111111111111111111111111112' ? tokenOutMint : tokenInMint

        const tokenPrice = await this.tokenMarketPrice.getTokenPricePumpFun(tokenToMc, solPriceUsd)
        // console.log('TOKEN PRICE:', tokenPrice)
        if (tokenPrice) {
          const { tokenMarketCap, supplyAmount } = await this.tokenMarketPrice.getTokenMktCap(
            tokenPrice,
            tokenToMc,
            true,
          )
          tokenMc = tokenMarketCap

          const tokenHoldings = await this.tokenUtils.getTokenHoldings(owner, tokenToMc, supplyAmount, true)

          currentHoldingPercentage = tokenHoldings.percentage
          currentHoldingPrice = tokenHoldings.balance
        }

        return {
          platform: swap,
          owner: walletAddress,
          description: swapDescription,
          type: nativeBalance?.type,
          balanceChange: nativeBalance?.balanceChange,
          signature: this.transactionSignature,
          swappedTokenMc: tokenMc,
          swappedTokenPrice: tokenPrice,
          solPrice: solPriceUsd || '',
          isNew: isNew,
          currenHoldingPercentage: currentHoldingPercentage,
          currentHoldingPrice: currentHoldingPrice,
          tokenTransfers: {
            tokenInSymbol: tokenIn,
            tokenInMint: tokenInMint,
            tokenAmountIn: amountIn,
            tokenOutSymbol: tokenOut,
            tokenOutMint: tokenOutMint,
            tokenAmountOut: amountOut,
          },
        }
      }
    } catch (error) {
      console.log('TRANSACTION_PARSER_ERROR', error)
      return
    }
  }

  public async parseSolTransfer(
    transactionDetails: (ParsedTransactionWithMeta | null)[],
    solPriceUsd: string | undefined,
    walletAddress: string,
  ): Promise<TransferParserInterface | undefined> {
    try {
      const transactions: any = []

      if (!transactionDetails) return

      // Transaction Metadata
      transactionDetails[0]?.meta?.innerInstructions?.forEach((i: any) => {
        i.instructions.forEach((r: any) => {
          if (r.parsed?.type === 'transfer' && r.parsed.info.amount !== undefined) {
            transactions.push(r.parsed)
          }
        })
      })

      transactionDetails[0]?.transaction.message.instructions.map((instruction: any) => {
        if (transactions.length <= 1 && instruction && instruction.parsed !== undefined) {
          transactions.push(instruction.parsed)
        }
      })

      // if length is more than 1 it was probably a token transfer or some stuff idk
      if (transactions.length < 1 || transactions.length > 1) return

      const amount = Number.isNaN(transactions[0].info.lamports / 1e9) ? 0 : transactions[0].info.lamports / 1e9

      const description = `${transactions[0].info.source} transferred ${transactions[0].info.lamports / 1e9} SOL to ${transactions[0].info.destination}`
      const solAmount = transactions[0].info.lamports / 1e9

      return {
        owner: walletAddress,
        description,
        fromAddress: transactions[0].info.source ?? 'Unknown',
        toAddress: transactions[0].info.destination ?? 'Unknown',
        lamportsAmount: transactions[0].info.lamports ?? 0,
        solAmount: solAmount ?? 0,
        solPrice: solPriceUsd ?? '0',
        signature: this.transactionSignature,
      }
    } catch {
      console.log('PARSE_TRANSFERS_ERROR')
      return
    }
  }
}
