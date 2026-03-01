import { PublicKey, Connection } from '@solana/web3.js'
import { ValidTransactions } from './valid-transactions'
import EventEmitter from 'events'
import { TransactionParser } from '../parsers/transaction-parser'
import { SendTransactionMsgHandler } from '../bot/handlers/send-tx-msg-handler'
import { bot } from '../providers/telegram'
import { SwapType, WalletWithUsers } from '../types/swap-types'
import { RateLimit } from './rate-limit'
import chalk from 'chalk'
import { RpcConnectionManager, HeliusConnectionManager } from '../providers/solana'
import pLimit from 'p-limit'
import { CronJobs } from './cron-jobs'
import { PrismaUserRepository } from '../repositories/prisma/user'
import { PrismaGroupRepository } from '../repositories/prisma/group'
import { WalletPool } from '../config/wallet-pool'
import TelegramBot from 'node-telegram-bot-api'
import { sendMessageToGroup, isTelegramUserConfigured } from '../providers/telegram-user'
import { TxMessagesRedesigned as TxMessages } from '../bot/messages/tx-messages-redesigned'
import { FormatNumbers } from './format-numbers'
import { NativeParserInterface } from '../types/general-interfaces'
import { TokenMetadataService } from './token-metadata'
import { TokenAnalysisService } from './token-analysis'

// Configuration for enhanced metadata fetching
const ENABLE_ENHANCED_METADATA = process.env.ENABLE_ENHANCED_METADATA === 'true'

export class WatchTransaction extends EventEmitter {
  private walletTransactions: Map<string, { count: number; startTime: number }>
  // Track which connection each wallet is using for proper cleanup
  private walletConnections: Map<string, Connection>
  // Track last BUY transaction time per wallet for 5-second cooldown
  private lastBuyTime: Map<string, number>

  private rateLimit: RateLimit

  private prismaUserRepository: PrismaUserRepository
  private prismaGroupRepository: PrismaGroupRepository
  
  // Reusable TokenAnalysisService instance to benefit from caching
  private tokenAnalysisService: TokenAnalysisService
  
  constructor() {
    super()
    this.walletTransactions = new Map()
    this.walletConnections = new Map()
    this.lastBuyTime = new Map()
    this.rateLimit = new RateLimit(WalletPool.subscriptions)
    this.prismaUserRepository = new PrismaUserRepository()
    this.prismaGroupRepository = new PrismaGroupRepository()
    this.tokenAnalysisService = new TokenAnalysisService()
  }

  public async watchSocket(wallets: WalletWithUsers[]): Promise<void> {
    if (!wallets || wallets.length === 0) {
      console.log(chalk.yellowBright('No wallets to watch'))
      return
    }
    
    try {
      for (const wallet of wallets) {
        if (!wallet || !wallet.address) {
          console.log(chalk.redBright('Invalid wallet object, skipping'))
          continue
        }
        
        let publicKey: PublicKey
        try {
          publicKey = new PublicKey(wallet.address)
        } catch (err) {
          console.log(chalk.redBright(`Invalid wallet address: ${wallet.address}, skipping`))
          continue
        }
        
        const walletAddress = publicKey.toBase58()

        // Check if a subscription already exists for this wallet address
        if (WalletPool.subscriptions.has(walletAddress)) {
          // console.log(`Already watching for: ${walletAddress}`)
          continue // Skip re-subscribing
        }

        // Get a Helius connection for this wallet (round-robin distribution)
        const heliusKeyCount = HeliusConnectionManager.getKeyCount()
        const logConnection = heliusKeyCount > 1 
          ? HeliusConnectionManager.getLogConnection()
          : RpcConnectionManager.logConnection

        console.log(
          chalk.greenBright(`Watching transactions for wallet: `) + 
          chalk.yellowBright.bold(walletAddress) +
          (heliusKeyCount > 1 ? chalk.cyan(` [Key ${(HeliusConnectionManager as any).logConnectionIndex || 1}/${heliusKeyCount}]`) : '')
        )

        // Initialize transaction count and timestamp
        this.walletTransactions.set(walletAddress, { count: 0, startTime: Date.now() })
        
        // Store the connection used for this wallet (for proper cleanup later)
        this.walletConnections.set(walletAddress, logConnection)

        // Start real-time log
        const subscriptionId = logConnection.onLogs(
          publicKey,
          async (logs, ctx) => {
            // Exclude wallets that have reached the limit
            if (WalletPool.bannedWallets.has(walletAddress)) {
              console.log(`Wallet ${walletAddress} is excluded from logging.`)

              return
            }

            // if (wallet.userWallets[0].status === 'SPAM_PAUSED') {
            //   console.log('PAUSED TRANSACTIONS FOR: ', walletAddress)
            //   return
            // }

            const { isRelevant, swap } = ValidTransactions.isRelevantTransaction(logs)

            if (!isRelevant) {
              // console.log('TRANSACTION IS NOT DEFI', logs.signature)
              return
            }
            // console.log('TRANSACTION IS DEFI', logs.signature)
            // check txs per second
            const walletData = this.walletTransactions.get(walletAddress)
            if (!walletData) {
              return
            }

            const isWalletRateLimited = await this.rateLimit.txPerSecondCap({
              wallet,
              bot,
              excludedWallets: WalletPool.bannedWallets,
              walletData,
            })

            if (isWalletRateLimited) {
              return
            }

            const transactionSignature = logs.signature

            const transactionDetails = await this.getParsedTransaction(transactionSignature)

            if (!transactionDetails || transactionDetails[0] === null) {
              return
            }

            // Parse transaction
            const solPriceUsd = CronJobs.getSolPrice()
            const transactionParser = new TransactionParser(transactionSignature)

            if (
              swap === 'raydium' ||
              swap === 'jupiter' ||
              swap === 'pumpfun' ||
              swap === 'mint_pumpfun' ||
              swap === 'pumpfun_amm'
            ) {
              const parsed = await transactionParser.parseDefiTransaction(
                transactionDetails,
                swap,
                solPriceUsd,
                walletAddress,
              )
              if (!parsed) {
                return
              }
              console.log(parsed.description)

              // Check 5-second cooldown - only for BUY transactions
              if (parsed.type === 'buy') {
                const now = Date.now()
                const lastBuy = this.lastBuyTime.get(walletAddress) || 0
                const timeSinceLastBuy = now - lastBuy

                // If less than 5 seconds since last BUY, ignore ALL transactions from this wallet
                if (timeSinceLastBuy < 5000) {
                  console.log(
                    chalk.yellowBright(
                      `⏸️  Cooldown: Ignoring transaction for ${walletAddress.slice(0, 8)}... (${(timeSinceLastBuy / 1000).toFixed(1)}s since last BUY)`
                    )
                  )
                  return
                }

                // Update last BUY time and send message
                this.lastBuyTime.set(walletAddress, now)
              } else {
                // For SELL transactions, check if wallet is in cooldown
                const now = Date.now()
                const lastBuy = this.lastBuyTime.get(walletAddress) || 0
                const timeSinceLastBuy = now - lastBuy

                if (timeSinceLastBuy < 5000) {
                  console.log(
                    chalk.yellowBright(
                      `⏸️  Cooldown: Ignoring SELL for ${walletAddress.slice(0, 8)}... (${(timeSinceLastBuy / 1000).toFixed(1)}s since last BUY)`
                    )
                  )
                  return
                }
              }

              await this.sendMessageToUsers(wallet, parsed, (handler, parsedData, userId) =>
                handler.sendTransactionMessage(parsedData, userId),
              )

              // Groups: only BUY messages, via Telegram User API
              if (parsed.type === 'buy') {
                this.sendBuyMessageToGroups(wallet, parsed).catch((err) =>
                  console.error('sendBuyMessageToGroups error:', err),
                )
              }
            } else if (swap === 'sol_transfer') {
              // Check if wallet is in cooldown before processing transfer
              const now = Date.now()
              const lastBuy = this.lastBuyTime.get(walletAddress) || 0
              const timeSinceLastBuy = now - lastBuy

              if (timeSinceLastBuy < 5000) {
                console.log(
                  chalk.yellowBright(
                    `⏸️  Cooldown: Ignoring SOL transfer for ${walletAddress.slice(0, 8)}... (${(timeSinceLastBuy / 1000).toFixed(1)}s since last BUY)`
                  )
                )
                return
              }

              const parsed = await transactionParser.parseSolTransfer(transactionDetails, solPriceUsd, walletAddress)
              if (!parsed) {
                return
              }
              console.log(parsed.description)

              // await this.sendTransferMessageToUsers(wallet, parsed)
              await this.sendMessageToUsers(wallet, parsed, (handler, parsedData, userId) =>
                handler.sendTransferMessage(parsedData, userId),
              )
            }
          },
          'processed',
        )

        // Store subscription ID
        WalletPool.subscriptions.set(wallet.address, subscriptionId)
        console.log(
          chalk.greenBright(`Subscribed to logs with subscription ID: `) + chalk.yellowBright.bold(subscriptionId),
        )
      }
    } catch (error) {
      console.error('Error in watchSocket:', error)
    }
  }

  public async getParsedTransaction(transactionSignature: string, retries = 4) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const single = await RpcConnectionManager.getRandomConnection().getParsedTransaction(
          transactionSignature,
          {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          },
        )

        if (single !== null) {
          return [single]
        }
      } catch (error) {
        console.error(`Attempt ${attempt}: Error fetching transaction details`, error)
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }

    console.error(`Failed to fetch transaction details after ${retries} retries for signature:`, transactionSignature)
    return null
  }

  private async sendMessageToUsers<T>(
    wallet: WalletWithUsers,
    parsed: T,
    sendMessageFn: (
      handler: SendTransactionMsgHandler,
      parsed: T,
      userId: string,
    ) => Promise<TelegramBot.Message | undefined>,
  ) {
    const sendMessageHandler = new SendTransactionMsgHandler(bot)

    const pausedUsers = (await this.prismaUserRepository.getPausedUsers(wallet.userWallets.map((w) => w.userId))) || []

    const activeUsers = wallet.userWallets.filter((w) => !pausedUsers || !pausedUsers.includes(w.userId))

    // Remove duplicate users - filter out undefined values
    const uniqueActiveUsers = Array.from(new Set(activeUsers.map((user) => user.userId)))
      .map((userId) => activeUsers.find((user) => user.userId === userId))
      .filter((user): user is NonNullable<typeof user> => user !== undefined)

    const limit = pLimit(20)

    const tasks = uniqueActiveUsers.map((user) =>
      limit(async () => {
        if (user) {
          try {
            await sendMessageFn(sendMessageHandler, parsed, user.userId)
          } catch (error) {
            console.log(`Error sending message to user ${user.userId}`)
          }
        }
      }),
    )

    await Promise.all(tasks)
  }

  /** Post BUY-only messages to groups using Telegram User API (Phase 2 & 3). */
  private async sendBuyMessageToGroups(wallet: WalletWithUsers, parsed: NativeParserInterface): Promise<void> {
    if (!isTelegramUserConfigured()) return
    const userIds = [...new Set(wallet.userWallets.map((w) => w.userId))]
    const groups = await this.prismaGroupRepository.getGroupIdsByUserIds(userIds)
    if (groups.length === 0) return

    const truncatedOwner = `${parsed.owner.slice(0, 4)}...${parsed.owner.slice(-4)}`
    
    // Build message - use same format as private chat
    let messageText: string
    let analysis: any = null
    
    if (ENABLE_ENHANCED_METADATA) {
      try {
        // Get token mint to fetch metadata
        const tokenToMc = parsed.type === 'buy' 
          ? parsed.tokenTransfers.tokenInMint 
          : parsed.tokenTransfers.tokenOutMint
        
        // Use the class instance TokenAnalysisService for better caching
        analysis = await this.tokenAnalysisService.analyzeToken(tokenToMc)
        
        if (analysis && (analysis.marketCap || analysis.liquidity || analysis.totalHolders)) {
          // Use new enhanced message format V2
          messageText = TxMessages.enhancedDefiTxMessageV2(parsed, analysis, truncatedOwner)
        } else {
          // Fallback to basic format
          messageText = this.buildBasicGroupMessage(parsed, truncatedOwner)
        }
      } catch {
        // Fallback to basic format on error
        messageText = this.buildBasicGroupMessage(parsed, truncatedOwner)
      }
    } else {
      // Use basic format when enhanced metadata is disabled
      messageText = this.buildBasicGroupMessage(parsed, truncatedOwner)
    }

    // Send to groups with filter checks per user's settings
    const handler = new SendTransactionMsgHandler(bot)
    const limit = pLimit(5)
    await Promise.all(
      groups.map((g) =>
        limit(async () => {
          // Check filters using the group owner's user ID, not the group ID
          if (await handler.shouldSendNotificationPublic(parsed, g.userId, analysis)) {
            await sendMessageToGroup(g.id, messageText, analysis?.image)
          }
        }),
      ),
    )
  }

  /** Build basic group message (fallback when enhanced metadata unavailable) */
  private buildBasicGroupMessage(parsed: NativeParserInterface, walletName: string): string {
    let tokenMarketCap = parsed.swappedTokenMc
    if (tokenMarketCap && tokenMarketCap < 1000) {
      tokenMarketCap *= 1000
    }
    const formattedMarketCap = tokenMarketCap ? FormatNumbers.formatPrice(tokenMarketCap) : undefined
    return TxMessages.defiTxMessage(parsed, formattedMarketCap, walletName)
  }
}
